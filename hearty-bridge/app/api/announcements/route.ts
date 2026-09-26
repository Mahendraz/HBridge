import { NextRequest } from 'next/server';
import { withAnyAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Announcement } from '@/models';
import { getR2SignedUrl } from '@/lib/services/r2-storage';
import { storeAnnouncementFile } from '@/lib/services/announcement-media';
import mongoose from 'mongoose';
import { logActivity } from '@/lib/utils/audit-log';

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
 * file: image (incl. HEIC), video (incl. iPhone .mov), or PDF.
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
      const stored = await storeAnnouncementFile(file);
      if (!stored.ok) {
        return stored.status === 500
          ? ErrorResponse.internalServerError(stored.error)
          : ErrorResponse.badRequest(stored.error);
      }
      attachments.push(stored.attachment);
    }

    const announcement = await Announcement.create({
      title,
      content,
      attachments,
      authorId: new mongoose.Types.ObjectId(user.userId),
      authorName: user.name || '',
      isActive: true,
    });

    logActivity(req, {
      category: 'announcement',
      action: 'announcement.created',
      title: `Pengumuman dibuat — ${announcement.title}`,
      description: `Oleh ${user.name}${attachments.length ? ' · dengan lampiran' : ''}`,
      actor: user,
      target: { type: 'announcement', id: announcement._id, name: announcement.title },
    });

    return SuccessResponse.created({ announcement }, 'Pengumuman berhasil dibuat');
  })
);
