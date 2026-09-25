import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Announcement, type IAnnouncementAttachment } from '@/models';
import { deleteFromR2 } from '@/lib/services/r2-storage';
import { storeAnnouncementFile } from '@/lib/services/announcement-media';
import mongoose from 'mongoose';

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

    // Store the replacement first, so a rejected file doesn't wipe the
    // existing attachment.
    let replacement: IAnnouncementAttachment | null = null;
    if (file && file.size > 0) {
      const stored = await storeAnnouncementFile(file);
      if (!stored.ok) {
        return stored.status === 500
          ? ErrorResponse.internalServerError(stored.error)
          : ErrorResponse.badRequest(stored.error);
      }
      replacement = stored.attachment;
    }

    if ((removeAttachment || replacement) && announcement.attachments.length) {
      await Promise.allSettled(
        announcement.attachments.map((att) => deleteFromR2(att.gcsPath))
      );
      announcement.attachments = [] as any;
    }

    if (replacement) announcement.attachments.push(replacement);

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
