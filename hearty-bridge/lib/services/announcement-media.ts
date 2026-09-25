import { after } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import { Announcement } from '@/models';
import type { IAnnouncementAttachment } from '@/models/Announcement';
import { uploadToR2 } from '@/lib/services/r2-storage';
import { transcodeVideoInBackground } from '@/lib/services/video-transcode';
import { compressImage } from '@/lib/utils/compress';
import { ANNOUNCEMENT_MIME_TYPES, resolveMimeType, mediaKind, getExtension } from '@/lib/utils/media-mime';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB, matches the repo-wide media limit

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

export type StoreAttachmentResult =
  | { ok: true; attachment: IAnnouncementAttachment }
  | { ok: false; error: string; status: 400 | 500 };

/**
 * Validates and stores one announcement attachment in R2 (SA-1).
 *   image  → HEIC converted to JPEG, everything compressed to WebP
 *   video  → raw file stored now, H.264 MP4 swapped in after the response
 *            (identified by its gcsPath, which is unique per upload)
 *   PDF    → stored as-is
 * Must be called inside a request (uses next/server's after()).
 */
export async function storeAnnouncementFile(file: File): Promise<StoreAttachmentResult> {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: 'File terlalu besar. Maksimal 100 MB', status: 400 };
  }

  // iOS can send an empty type for camera files — fall back to the extension.
  const mimeType = resolveMimeType(file.type, file.name);
  if (!ANNOUNCEMENT_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: `Tipe file tidak didukung: ${file.type || file.name}`, status: 400 };
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const kind = mediaKind(mimeType);
  const keyPrefix = `announcements/${Date.now()}-${sanitizeFileName(file.name).replace(/\.[^.]+$/, '')}`;

  if (kind === 'video') {
    const rawKey = `${keyPrefix}.${getExtension(file.name) || 'mp4'}`;
    if (!(await uploadToR2(rawBuffer, rawKey, mimeType))) {
      return { ok: false, error: 'Upload ke storage gagal. Periksa kredensial R2.', status: 500 };
    }

    after(() =>
      transcodeVideoInBackground({
        rawKey,
        rawBuffer,
        mimeType,
        keyPrefix,
        swap: async (result) => {
          await connectToDatabase();
          const set = result
            ? {
                'attachments.$.gcsPath': result.key,
                'attachments.$.url': result.key,
                'attachments.$.mimeType': result.mimeType,
                'attachments.$.size': result.size,
                'attachments.$.processingStatus': 'ready',
              }
            : { 'attachments.$.processingStatus': 'ready' };
          const res = await Announcement.updateOne({ 'attachments.gcsPath': rawKey }, { $set: set });
          return res.matchedCount > 0;
        },
      })
    );

    return {
      ok: true,
      attachment: {
        fileName: file.name,
        fileType: 'video',
        gcsPath: rawKey,
        url: rawKey, // raw key; signed URL generated fresh on every GET
        mimeType,
        size: rawBuffer.length,
        uploadedAt: new Date(),
        processingStatus: 'processing',
      },
    };
  }

  let stored: { buffer: Buffer; mimeType: string; ext: string };
  if (kind === 'image') {
    try {
      stored = await compressImage(rawBuffer, mimeType);
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Gagal memproses gambar', status: 400 };
    }
  } else {
    stored = { buffer: rawBuffer, mimeType, ext: getExtension(file.name) || 'bin' };
  }

  const key = `${keyPrefix}.${stored.ext}`;
  if (!(await uploadToR2(stored.buffer, key, stored.mimeType))) {
    return { ok: false, error: 'Upload ke storage gagal. Periksa kredensial R2.', status: 500 };
  }

  return {
    ok: true,
    attachment: {
      fileName: file.name,
      fileType: kind === 'image' ? 'image' : 'document',
      gcsPath: key,
      url: key, // raw key; signed URL generated fresh on every GET
      mimeType: stored.mimeType,
      size: stored.buffer.length,
      uploadedAt: new Date(),
      processingStatus: 'ready',
    },
  };
}
