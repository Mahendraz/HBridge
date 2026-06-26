import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report } from '@/models';
import ReportComment from '@/models/ReportComment';
import mongoose from 'mongoose';

function getReportId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('reports');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

async function canAccess(report: any, user: any): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (user.role === 'therapist') return report.therapistId?.toString() === user.userId;
  if (user.role === 'parent') {
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
 * GET /api/reports/[id]/comments
 * Returns all active comments on the report, sorted oldest-first.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) return ErrorResponse.badRequest('Invalid report ID');

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, isActive: true }).lean();
    if (!report) return ErrorResponse.notFound('Report');
    if (!(await canAccess(report, user))) return ErrorResponse.forbidden();

    const comments = await ReportComment.find({ reportId: new mongoose.Types.ObjectId(id), isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    return SuccessResponse.ok({ comments });
  })
);

/**
 * POST /api/reports/[id]/comments
 * Add a comment (any role). Body: { text, parentCommentId? }
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) return ErrorResponse.badRequest('Invalid report ID');

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, isActive: true }).lean();
    if (!report) return ErrorResponse.notFound('Report');
    if (!(await canAccess(report, user))) return ErrorResponse.forbidden();

    const body = await req.json();
    const text = (body.text as string | undefined)?.trim() ?? '';
    if (!text) return ErrorResponse.badRequest('Komentar tidak boleh kosong');
    if (text.length > 1000) return ErrorResponse.badRequest('Komentar maksimal 1000 karakter');

    const parentCommentId =
      body.parentCommentId && mongoose.Types.ObjectId.isValid(body.parentCommentId)
        ? new mongoose.Types.ObjectId(body.parentCommentId)
        : null;

    const comment = await ReportComment.create({
      reportId:   new mongoose.Types.ObjectId(id),
      childId:    (report as any).childId,
      therapistId: (report as any).therapistId,
      authorId:   new mongoose.Types.ObjectId(user.userId),
      authorName: user.name || '',
      authorRole: user.role,
      text,
      parentCommentId,
      isResolved: false,
      isActive: true,
    });

    return SuccessResponse.ok({ comment });
  })
);
