import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Announcement } from '@/models';
import { uploadToR2, deleteFromR2 } from '@/lib/services/r2-storage';
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

function getAnnouncementId(req: NextRequest): string {
  return new URL(req.url).pathname.split('/').at(-1) ?? '';
}

/**
 * PUT /api/announcements/[id]
 * Update title/content; an optional new `file` replaces any existing
 * attachment (old R2 object cleaned up). admin/super_admin only.
 * multipart/form-data: { title?, content?, file?, removeAttachment? }
 */
export const PUT = withAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const id = getAnnouncementId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ErrorResponse.badRequest('Invalid announcement ID');
    }

    await connectToDatabase();

    const announcement = await Announcement.findOne({ _id: id, isActive: true });
    if (!announcement) return ErrorResponse.notFound('Announcement');

    const formData = await req.formData();
    const title = formData.get('title') as string | null;
    const content = formData.get('content') as string | null;
    const file = formData.get('file') as File | null;
    const removeAttachment = formData.get('removeAttachment') === 'true';

    if (title !== null && title.trim()) announcement.title = title.trim();
    if (content !== null && content.trim()) announcement.content = content.trim();

    if ((removeAttachment || (file && file.size > 0)) && announcement.attachments.length) {
      await Promise.allSettled(
        announcement.attachments.map((att) => deleteFromR2(att.gcsPath))
      );
      announcement.attachments = [] as any;
    }

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

      announcement.attachments.push({
        fileName: file.name,
        fileType: isImage ? 'image' : 'document',
        gcsPath: destination,
        url: destination,
        mimeType: compressed.mimeType,
        size: compressed.buffer.length,
        uploadedAt: new Date(),
      } as any);
    }

    await announcement.save();

    return SuccessResponse.ok({ announcement }, 'Pengumuman berhasil diperbarui');
  })
);

/**
 * DELETE /api/announcements/[id]
 * Soft-delete (isActive = false) + best-effort R2 cleanup. admin/super_admin only.
 */
export const DELETE = withAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const id = getAnnouncementId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ErrorResponse.badRequest('Invalid announcement ID');
    }

    await connectToDatabase();

    const announcement = await Announcement.findOne({ _id: id, isActive: true });
    if (!announcement) return ErrorResponse.notFound('Announcement');

    if (announcement.attachments.length) {
      await Promise.allSettled(
        announcement.attachments.map((att) => deleteFromR2(att.gcsPath))
      );
    }

    announcement.isActive = false;
    await announcement.save();

    return SuccessResponse.ok({ success: true }, 'Pengumuman berhasil dihapus');
  })
);
