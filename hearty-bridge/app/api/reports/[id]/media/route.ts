import { NextRequest, NextResponse, after } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report } from '@/models';
import { uploadToR2, deleteFromR2 } from '@/lib/services/r2-storage';
import { compressImage, compressVideo } from '@/lib/utils/compress';
import { canAccessReport } from '@/lib/utils/report-access';
import mongoose from 'mongoose';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function getReportId(req: NextRequest): string {
  // pathname: /api/reports/{id}/media → second to last segment
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 2] ?? '';
}

function detectFileType(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

/**
 * Runs after the upload response has already been sent (see after() in
 * POST below). Compresses the raw video, uploads the result under a new
 * key, and swaps the report's media entry over to it — identified by the
 * raw file's gcsPath, the same identity DELETE already uses. If ffmpeg is
 * unavailable or compression fails, compressVideo falls back to returning
 * the original buffer untouched (same reference), which is detected here
 * so nothing gets re-uploaded — the entry just flips to 'ready' in place.
 */
async function compressVideoInBackground(
  reportId: string,
  rawDestination: string,
  rawBuffer: Buffer,
  mimeType: string,
  baseName: string
): Promise<void> {
  try {
    const compressed = await compressVideo(rawBuffer, mimeType);

    if (compressed.buffer === rawBuffer) {
      await connectToDatabase();
      await Report.updateOne(
        { _id: reportId, 'mediaFiles.gcsPath': rawDestination },
        { $set: { 'mediaFiles.$.processingStatus': 'ready' } }
      );
      return;
    }

    const compressedDestination = `reports/${reportId}/${Date.now()}-${baseName}-c.${compressed.ext}`;
    const compressedKey = await uploadToR2(compressed.buffer, compressedDestination, compressed.mimeType);

    await connectToDatabase();

    if (!compressedKey) {
      console.error('[media/POST] background compression upload failed, keeping raw video:', rawDestination);
      await Report.updateOne(
        { _id: reportId, 'mediaFiles.gcsPath': rawDestination },
        { $set: { 'mediaFiles.$.processingStatus': 'ready' } }
      );
      return;
    }

    await Report.updateOne(
      { _id: reportId, 'mediaFiles.gcsPath': rawDestination },
      {
        $set: {
          'mediaFiles.$.gcsPath': compressedDestination,
          'mediaFiles.$.url': compressedDestination,
          'mediaFiles.$.mimeType': compressed.mimeType,
          'mediaFiles.$.size': compressed.buffer.length,
          'mediaFiles.$.processingStatus': 'ready',
        },
      }
    );

    await deleteFromR2(rawDestination).catch(() => {});
  } catch (err) {
    console.error('[media/POST] background video processing failed:', err);
    try {
      await connectToDatabase();
      await Report.updateOne(
        { _id: reportId, 'mediaFiles.gcsPath': rawDestination },
        { $set: { 'mediaFiles.$.processingStatus': 'ready' } }
      );
    } catch {
      // best-effort — the entry stays 'processing' if even this fails
    }
  }
}

/**
 * POST /api/reports/[id]/media
 * Upload a photo or video file to GCS and attach it to the report.
 * FormData: { file: File }
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

    const report = await Report.findOne({ _id: reportId, isActive: true });
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (!(await canAccessReport(report, user))) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is 100 MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const fileType  = detectFileType(file.type);
    const baseName  = sanitizeFileName(file.name).replace(/\.[^.]+$/, '');

    // Video: upload the raw file and respond right away — ffmpeg transcoding
    // (the actual slow part, previously awaited here and blocking the whole
    // request for as long as it took) runs in the background afterward and
    // swaps the media entry over to the compressed version in place. The raw
    // file is immediately watchable in the meantime.
    if (fileType === 'video') {
      const rawExt = file.name.split('.').pop() ?? 'mp4';
      const rawDestination = `reports/${reportId}/${Date.now()}-${baseName}.${rawExt}`;

      const rawKey = await uploadToR2(rawBuffer, rawDestination, file.type);
      if (!rawKey) {
        console.error('[media/POST] R2 upload returned null for key:', rawDestination);
        return NextResponse.json(
          { success: false, error: 'Upload to storage failed. Check R2 credentials and bucket name.' },
          { status: 500 }
        );
      }

      report.mediaFiles.push({
        fileName: file.name,
        fileType: 'video',
        gcsPath: rawDestination,
        url: rawDestination,
        mimeType: file.type,
        size: rawBuffer.length,
        uploadedAt: new Date(),
        processingStatus: 'processing',
      });
      await report.save();

      const responseData = report.mediaFiles;

      // Scheduled via next/server's after() rather than a bare un-awaited
      // promise so it's guaranteed to run to completion even on a serverless
      // deploy target, not just this app's current long-running Node process.
      after(() => compressVideoInBackground(reportId, rawDestination, rawBuffer, file.type, baseName));

      return NextResponse.json({ success: true, data: responseData }, { status: 201 });
    }

    // Image/document — small and fast enough to compress synchronously.
    let compressed: { buffer: Buffer; mimeType: string; ext: string };
    if (file.type.startsWith('image/')) {
      compressed = await compressImage(rawBuffer, file.type);
    } else {
      const ext = file.name.split('.').pop() ?? 'bin';
      compressed = { buffer: rawBuffer, mimeType: file.type, ext };
    }

    const destination = `reports/${reportId}/${Date.now()}-${baseName}.${compressed.ext}`;

    const key = await uploadToR2(compressed.buffer, destination, compressed.mimeType);

    if (!key) {
      console.error('[media/POST] R2 upload returned null for key:', destination);
      return NextResponse.json(
        { success: false, error: 'Upload to storage failed. Check R2 credentials and bucket name.' },
        { status: 500 }
      );
    }

    report.mediaFiles.push({
      fileName: file.name,
      fileType,
      gcsPath: destination,
      url: destination, // raw key; signed URL is generated fresh on every GET
      mimeType: compressed.mimeType,
      size: compressed.buffer.length,
      uploadedAt: new Date(),
      processingStatus: 'ready',
    });

    await report.save();

    return NextResponse.json({
      success: true,
      data: report.mediaFiles,
    }, { status: 201 });
  })
);

/**
 * DELETE /api/reports/[id]/media?fileName=...
 * Remove a media file from GCS and from the report.
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

    const gcsPath = new URL(req.url).searchParams.get('fileName');
    if (!gcsPath) {
      return NextResponse.json({ success: false, error: 'fileName query param required' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await Report.findOne({ _id: reportId, isActive: true });
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (!(await canAccessReport(report, user))) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Delete from R2 (best-effort, don't fail if already gone)
    await deleteFromR2(gcsPath);

    report.mediaFiles = report.mediaFiles.filter((m) => m.gcsPath !== gcsPath) as any;
    await report.save();

    return NextResponse.json({ success: true, data: report.mediaFiles });
  })
);
