import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report } from '@/models';
import mongoose from 'mongoose';
import { getR2SignedUrl, deleteFromR2 } from '@/lib/services/r2-storage';

function getReportId(req: NextRequest): string {
  return new URL(req.url).pathname.split('/').at(-1) ?? '';
}

async function canAccessReport(report: any, user: any): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (user.role === 'therapist') {
    return report.therapistId?.toString() === user.userId;
  }
  if (user.role === 'parent') {
    // Check if the child belongs to this parent
    const Child = mongoose.models.Child ||
      mongoose.model('Child', new mongoose.Schema({ parentId: mongoose.Schema.Types.ObjectId }));
    const child = await Child.findOne({
      _id: report.childId,
      parentId: new mongoose.Types.ObjectId(user.userId),
    }).lean();
    return !!child;
  }
  return false;
}

/**
 * GET /api/reports/[id]
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, isActive: true }).lean();
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (!(await canAccessReport(report, user))) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Generate fresh signed URLs for all media files (private R2 bucket)
    const mediaFiles = await Promise.all(
      ((report as any).mediaFiles ?? []).map(async (m: any) => {
        const signedUrl = m.gcsPath ? await getR2SignedUrl(m.gcsPath) : null;
        return { ...m, url: signedUrl ?? m.url };
      })
    );

    return NextResponse.json({ success: true, data: { ...report, mediaFiles } });
  })
);

/**
 * PUT /api/reports/[id]
 * Update report fields. Only the creator therapist or admin may edit.
 */
export const PUT = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role === 'parent') {
      return NextResponse.json({ success: false, error: 'Parents cannot edit reports' }, { status: 403 });
    }

    const id = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, isActive: true });
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && report.therapistId?.toString() !== user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const allowed = ['title', 'description', 'content', 'type', 'status', 'dueDate', 'tags', 'childName', 'therapistName'];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'dueDate') {
          (report as any)[key] = body[key] ? new Date(body[key]) : undefined;
        } else if (key === 'tags') {
          (report as any)[key] = Array.isArray(body[key])
            ? body[key].map((t: string) => t.trim()).filter(Boolean)
            : [];
        } else {
          (report as any)[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
        }
      }
    }

    await report.save();

    return NextResponse.json({ success: true, data: report });
  })
);

/**
 * DELETE /api/reports/[id]
 * Soft-delete the report (isActive = false).
 * Only the creator therapist or admin may delete.
 */
export const DELETE = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role === 'parent') {
      return NextResponse.json({ success: false, error: 'Parents cannot delete reports' }, { status: 403 });
    }

    const id = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid report ID' }, { status: 400 });
    }

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, isActive: true });
    if (!report) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && report.therapistId?.toString() !== user.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Delete all media files from R2 (best-effort — don't fail the request if R2 is unavailable)
    if ((report as any).mediaFiles?.length) {
      await Promise.allSettled(
        (report as any).mediaFiles.map((m: any) => m.gcsPath ? deleteFromR2(m.gcsPath) : Promise.resolve())
      );
    }

    report.isActive = false;
    await report.save();

    return NextResponse.json({ success: true, message: 'Report deleted' });
  })
);
