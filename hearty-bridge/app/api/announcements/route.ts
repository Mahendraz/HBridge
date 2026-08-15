import { NextRequest } from 'next/server';
import { withAnyAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Announcement } from '@/models';
import { uploadToR2, getR2SignedUrl } from '@/lib/services/r2-storage';
import { compressImage } from '@/lib/utils/compress';
import mongoose from 'mongoose';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB, matches the repo-wide media limit

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

async function injectSignedUrls(announcements: any[]): Promise<any[]> {
  return Promise.all(
    announcements.map(async (a) => {
      if (!a.attachments?.length) return a;
      const attachments = await Promise.all(
        a.attachments.map(async (att: any) => {
          if (!att.gcsPath) return att;
          const signedUrl = await getR2SignedUrl(att.gcsPath);
          return { ...att, url: signedUrl ?? att.url };
        })
      );
      return { ...a, attachments };
    })
  );
}

/**
 * GET /api/announcements
 * Returns active announcements, newest first. Visible to any authenticated
 * role — announcements:view is universal, so withAnyAuth alone is the gate.
 */
export const GET = withAnyAuth(
  withErrorHandling(async () => {
    await connectToDatabase();

    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const withUrls = await injectSignedUrls(announcements);

    return SuccessResponse.ok({ announcements: withUrls });
  })
);

/**
 * POST /api/announcements
 * Create a new announcement. admin/super_admin only (announcements:manage).
 * multipart/form-data: { title, content, file? }
 */
export const POST = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const formData = await req.formData();
    const title = ((formData.get('title') as string | null) ?? '').trim();
    const content = ((formData.get('content') as string | null) ?? '').trim();
    const file = formData.get('file') as File | null;

    if (!title) return ErrorResponse.badRequest('Judul wajib diisi');
    if (!content) return ErrorResponse.badRequest('Isi pengumuman wajib diisi');

    const attachments: any[] = [];

    if (file && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) {
        return ErrorResponse.badRequest('File terlalu besar. Maksimal 100 MB');
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return ErrorResponse.badRequest(`Tipe file tidak didukung: ${file.type}`);
      }

      const rawBuffer = Buffer.from(await file.arrayBuffer());
      const isImage = file.type.startsWith('image/');

      const compressed = isImage
        ? await compressImage(rawBuffer, file.type)
        : { buffer: rawBuffer, mimeType: file.type, ext: file.name.split('.').pop() ?? 'bin' };

      const baseName = sanitizeFileName(file.name).replace(/\.[^.]+$/, '');
      const destination = `announcements/${Date.now()}-${baseName}.${compressed.ext}`;

      const key = await uploadToR2(compressed.buffer, destination, compressed.mimeType);
      if (!key) {
        return ErrorResponse.internalServerError('Upload ke storage gagal. Periksa kredensial R2.');
      }

      attachments.push({
        fileName: file.name,
        fileType: isImage ? 'image' : 'document',
        gcsPath: destination,
        url: destination, // raw key; signed URL generated fresh on every GET
        mimeType: compressed.mimeType,
        size: compressed.buffer.length,
        uploadedAt: new Date(),
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      attachments,
      authorId: new mongoose.Types.ObjectId(user.userId),
      authorName: user.name || '',
      isActive: true,
    });

    return SuccessResponse.created({ announcement }, 'Pengumuman berhasil dibuat');
  })
);
