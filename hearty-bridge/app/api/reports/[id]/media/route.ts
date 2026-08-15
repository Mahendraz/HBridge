import { NextRequest, NextResponse } from 'next/server';
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

    // Compress — each function falls back to the original if sharp/ffmpeg unavailable
    let compressed: { buffer: Buffer; mimeType: string; ext: string };
    if (file.type.startsWith('image/')) {
      compressed = await compressImage(rawBuffer, file.type);
    } else if (file.type.startsWith('video/')) {
      compressed = await compressVideo(rawBuffer, file.type);
    } else {
      const ext = file.name.split('.').pop() ?? 'bin';
      compressed = { buffer: rawBuffer, mimeType: file.type, ext };
    }

    const baseName    = sanitizeFileName(file.name).replace(/\.[^.]+$/, '');
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
