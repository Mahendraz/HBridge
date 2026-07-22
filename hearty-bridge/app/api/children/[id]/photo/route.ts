import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import mongoose from 'mongoose';
import { uploadToR2, deleteFromR2, getR2SignedUrl } from '@/lib/services/r2-storage';

const ALLOWED = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function getChildId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('children');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

/**
 * POST /api/children/[id]/photo
 * Admin only. Accepts multipart/form-data with field "file".
 * Uploads to R2, stores signed URL on child.photoUrl.
 */
export const POST = withAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const childId = getChildId(req);
    if (!childId || !mongoose.isValidObjectId(childId)) {
      return ErrorResponse.badRequest('Invalid child ID');
    }

    await connectToDatabase();

    const child = await Child.findOne({ _id: childId, isActive: true });
    if (!child) return ErrorResponse.notFound('Pasien tidak ditemukan');

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !file.size) return ErrorResponse.badRequest('File gambar diperlukan');
    if (!ALLOWED.includes(file.type)) return ErrorResponse.badRequest('Hanya JPG, PNG, atau WebP yang diizinkan');
    if (file.size > MAX_SIZE) return ErrorResponse.badRequest('Ukuran file maksimal 5MB');

    // Delete old photo if exists
    const oldKey = child.photoUrl ? extractR2Key(child.photoUrl) : null;

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const key = `children/${childId}/photo-${Date.now()}.${ext}`;

    const uploadedKey = await uploadToR2(buffer, key, file.type);
    if (!uploadedKey) return ErrorResponse.internalServerError('Gagal mengupload gambar');

    if (oldKey) await deleteFromR2(oldKey).catch(() => {});

    // Use native driver directly — bypasses Mongoose model cache / strict-mode issues
    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database connection not ready');

    const childOid = new mongoose.Types.ObjectId(childId);
    const updateResult = await db.collection('children').updateOne(
      { _id: childOid, isActive: true },
      { $set: { photoUrl: uploadedKey } }
    );

    if (updateResult.matchedCount === 0) {
      return ErrorResponse.notFound('Pasien tidak ditemukan');
    }

    // Re-read to confirm the value is actually stored
    const verified = await db.collection('children').findOne(
      { _id: childOid },
      { projection: { photoUrl: 1 } }
    );

    const savedKey = verified?.photoUrl as string | null | undefined;
    if (!savedKey) {
      return ErrorResponse.internalServerError('Foto terupload ke storage tapi gagal disimpan ke database');
    }

    const signedUrl = await getR2SignedUrl(savedKey, 3600);
    return SuccessResponse.ok({ photoUrl: signedUrl ?? savedKey });
  })
);

/**
 * DELETE /api/children/[id]/photo
 * Admin only. Removes the photo from R2 and clears photoUrl.
 */
export const DELETE = withAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const childId = getChildId(req);
    if (!childId || !mongoose.isValidObjectId(childId)) {
      return ErrorResponse.badRequest('Invalid child ID');
    }

    await connectToDatabase();

    const child = await Child.findOne({ _id: childId, isActive: true });
    if (!child) return ErrorResponse.notFound('Pasien tidak ditemukan');

    if (child.photoUrl) {
      const key = extractR2Key(child.photoUrl);
      if (key) await deleteFromR2(key).catch(() => {});
    }

    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database connection not ready');
    await db.collection('children').updateOne(
      { _id: new mongoose.Types.ObjectId(childId) },
      { $set: { photoUrl: null } }
    );

    return SuccessResponse.ok({ message: 'Foto dihapus' });
  })
);

// The photoUrl stored is the raw R2 key (e.g. "children/abc/photo-123.jpg").
// If someone stored a full signed URL in the past, fall back gracefully.
function extractR2Key(value: string): string | null {
  if (!value) return null;
  if (value.startsWith('http')) {
    // Try to extract key from URL path (before the '?')
    try {
      const url = new URL(value);
      return url.pathname.replace(/^\//, '');
    } catch {
      return null;
    }
  }
  return value;
}
