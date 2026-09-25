import { NextRequest, NextResponse, after } from 'next/server';
import { randomUUID } from 'crypto';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report } from '@/models';
import type { IReportMediaFile } from '@/models/Report';
import { uploadToR2, deleteFromR2 } from '@/lib/services/r2-storage';
import { transcodeVideoInBackground } from '@/lib/services/video-transcode';
import { compressImage } from '@/lib/utils/compress';
import { REPORT_MEDIA_MIME_TYPES, resolveMimeType, mediaKind, getExtension } from '@/lib/utils/media-mime';
import { canAccessReport } from '@/lib/utils/report-access';
import mongoose from 'mongoose';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function getReportId(req: NextRequest): string {
  // pathname: /api/reports/{id}/media → second to last segment
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 2] ?? '';
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

// The report form generates the uploadId client-side so it can delete an
// upload it cancelled while the request was still in flight.
function sanitizeUploadId(value: FormDataEntryValue | null): string {
  return typeof value === 'string' && /^[a-zA-Z0-9-]{8,64}$/.test(value) ? value : randomUUID();
}

/**
 * POST /api/reports/[id]/media
 * Upload a photo or video file to R2 and attach it to the report.
 * FormData: { file: File, uploadId?: string }
 * Responds with the new media entry.
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role === 'parent') {
      return NextResponse.json({ success: false, error: 'Parents cannot upload media' }, { status: 403 });
    }

    const reportId = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return NextResponse.json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await Report.findOne({ _id: reportId, isActive: true }).select('childId therapistId status').lean();
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (!(await canAccessReport(report, user))) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const uploadId = sanitizeUploadId(formData.get('uploadId'));

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is 100 MB` },
        { status: 400 }
      );
    }

    // iOS can send an empty type for camera files — fall back to the extension.
    const mimeType = resolveMimeType(file.type, file.name);
    if (!REPORT_MEDIA_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: `Format file tidak didukung: ${file.type || file.name}` },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const fileType  = mediaKind(mimeType);
    const baseName  = sanitizeFileName(file.name).replace(/\.[^.]+$/, '');
    const keyPrefix = `reports/${reportId}/${Date.now()}-${baseName}`;

    let entry: IReportMediaFile;

    // Video: upload the raw file and respond right away — ffmpeg transcoding
    // to H.264 (the slow part, and what makes iPhone HEVC playable outside
    // Apple devices) runs in the background afterward and swaps the media
    // entry over to the MP4 in place.
    if (fileType === 'video') {
      const rawDestination = `${keyPrefix}.${getExtension(file.name) || 'mp4'}`;

      const rawKey = await uploadToR2(rawBuffer, rawDestination, mimeType);
      if (!rawKey) {
        console.error('[media/POST] R2 upload returned null for key:', rawDestination);
        return NextResponse.json(
          { success: false, error: 'Upload to storage failed. Check R2 credentials and bucket name.' },
          { status: 500 }
        );
      }

      entry = {
        fileName: file.name,
        fileType: 'video',
        gcsPath: rawDestination,
        url: rawDestination,
        mimeType,
        size: rawBuffer.length,
        uploadedAt: new Date(),
        processingStatus: 'processing',
        uploadId,
      };

      // Scheduled via next/server's after() rather than a bare un-awaited
      // promise so it's guaranteed to run to completion even on a serverless
      // deploy target, not just this app's current long-running Node process.
      after(() =>
        transcodeVideoInBackground({
          rawKey: rawDestination,
          rawBuffer,
          mimeType,
          keyPrefix,
          swap: async (result) => {
            await connectToDatabase();
            const set = result
              ? {
                  'mediaFiles.$.gcsPath': result.key,
                  'mediaFiles.$.url': result.key,
                  'mediaFiles.$.mimeType': result.mimeType,
                  'mediaFiles.$.size': result.size,
                  'mediaFiles.$.processingStatus': 'ready',
                }
              : { 'mediaFiles.$.processingStatus': 'ready' };
            const res = await Report.updateOne(
              { _id: reportId, 'mediaFiles.gcsPath': rawDestination },
              { $set: set }
            );
            return res.matchedCount > 0;
          },
        })
      );
    } else {
      // Image — small and fast enough to compress synchronously. HEIC is
      // converted here; a HEIC that can't be decoded is rejected.
      let compressed: { buffer: Buffer; mimeType: string; ext: string };
      try {
        compressed = await compressImage(rawBuffer, mimeType);
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err instanceof Error ? err.message : 'Gagal memproses gambar' },
          { status: 400 }
        );
      }

      const destination = `${keyPrefix}.${compressed.ext}`;
      const key = await uploadToR2(compressed.buffer, destination, compressed.mimeType);
      if (!key) {
        console.error('[media/POST] R2 upload returned null for key:', destination);
        return NextResponse.json(
          { success: false, error: 'Upload to storage failed. Check R2 credentials and bucket name.' },
          { status: 500 }
        );
      }

      entry = {
        fileName: file.name,
        fileType,
        gcsPath: destination,
        url: destination, // raw key; signed URL is generated fresh on every GET
        mimeType: compressed.mimeType,
        size: compressed.buffer.length,
        uploadedAt: new Date(),
        processingStatus: 'ready',
        uploadId,
      };
    }

    // Atomic $push rather than load-modify-save: the form uploads several
    // files in parallel, and background transcodes update entries at the
    // same time.
    await Report.updateOne({ _id: reportId }, { $push: { mediaFiles: entry } });

    return NextResponse.json({ success: true, data: entry }, { status: 201 });
  })
);

/**
 * DELETE /api/reports/[id]/media?uploadId=...   (or legacy ?fileName=<gcsPath>)
 * Remove a media file from R2 and from the report.
 */
export const DELETE = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role === 'parent') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const reportId = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return NextResponse.json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    const params = new URL(req.url).searchParams;
    const uploadId = params.get('uploadId');
    const gcsPath = params.get('fileName');
    if (!uploadId && !gcsPath) {
      return NextResponse.json({ success: false, error: 'uploadId or fileName query param required' }, { status: 400 });
    }
    const match = uploadId ? { uploadId } : { gcsPath: gcsPath! };

    await connectToDatabase();

    const report = await Report.findOne({ _id: reportId, isActive: true }).select('childId therapistId status').lean();
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (!(await canAccessReport(report, user))) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Pull atomically and read the entry as it was at that instant, so the
    // R2 key deleted is the current one even if a background transcode
    // swapped it a moment ago.
    const before = await Report.findOneAndUpdate(
      { _id: reportId },
      { $pull: { mediaFiles: match } },
      { returnDocument: 'before' }
    ).lean();

    const removed = (before?.mediaFiles ?? []).find((m) =>
      uploadId ? m.uploadId === uploadId : m.gcsPath === gcsPath
    );
    // Best-effort, don't fail if already gone
    if (removed) await deleteFromR2(removed.gcsPath);

    return NextResponse.json({ success: true });
  })
);
