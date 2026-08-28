import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report } from '@/models';
import mongoose from 'mongoose';
import { getR2SignedUrl } from '@/lib/services/r2-storage';
import { canAccessReport } from '@/lib/utils/report-access';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportPdfDocument, type ReportPdfData } from '@/components/reports/report-pdf-template';
import sharp from 'sharp';

// @react-pdf/renderer's built-in image decoders only understand JPEG/PNG — formats
// like WebP silently fail to render (no error, just a blank spot). Re-encode every
// media thumbnail to PNG via sharp and inline it as a data URI, which also avoids
// react-pdf having to fetch the R2 signed URL itself at render time.
async function toPngDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    const png = await sharp(bytes).resize({ width: 500, withoutEnlargement: true }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch (err) {
    console.error('[reports/pdf] failed to convert media thumbnail:', err);
    return null;
  }
}

function getReportId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('reports');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

/**
 * GET /api/reports/[id]/pdf
 * Streams a generated PDF of the report. Same access rule as GET /api/reports/[id].
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) return ErrorResponse.badRequest('Invalid report ID');

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, isActive: true }).lean();
    if (!report) return ErrorResponse.notFound('Report');
    if (!(await canAccessReport(report, user))) return ErrorResponse.forbidden();

    const mediaFiles = (report as any).mediaFiles ?? [];
    const imageFiles = mediaFiles.filter((m: any) => m.fileType === 'image').slice(0, 6);
    const imageUrls = await Promise.all(
      imageFiles.map(async (m: any) => (m.gcsPath ? await getR2SignedUrl(m.gcsPath) : m.url))
    );
    const mediaImages = (
      await Promise.all(imageUrls.filter(Boolean).map((u: string) => toPngDataUri(u)))
    ).filter(Boolean) as string[];

    const data: ReportPdfData = {
      title: (report as any).title,
      description: (report as any).description,
      content: (report as any).content,
      type: (report as any).type,
      childName: (report as any).childName,
      therapistName: (report as any).therapistName,
      sessionDate: (report as any).sessionDate ?? null,
      createdAt: (report as any).createdAt,
      mediaImages,
    };

    const buffer = await renderToBuffer(ReportPdfDocument({ report: data }));
    const fileName = `Laporan-${data.childName.replace(/[^a-zA-Z0-9]+/g, '-')}-${id}.pdf`;

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  })
);
