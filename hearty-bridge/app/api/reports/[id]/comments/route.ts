import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report, Child } from '@/models';
import ReportComment from '@/models/ReportComment';
import mongoose from 'mongoose';
import { canAccessReport as canAccess } from '@/lib/utils/report-access';
import { notify } from '@/lib/utils/notify';

function getReportId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('reports');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
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

    // Notify the other party — therapist if a parent/admin commented, parent if the therapist/admin commented.
    const reportTitle = (report as any).title || 'laporan';
    const link = `/dashboard/reports?reportId=${id}`;
    if (user.role === 'parent') {
      const therapistId = (report as any).therapistId;
      if (therapistId && therapistId.toString() !== user.userId) {
        await notify({
          recipientId: therapistId,
          type: 'new_comment',
          title: `Komentar baru di "${reportTitle}"`,
          body: `${user.name} mengomentari laporan.`,
          link,
        });
      }
    } else {
      const child = await Child.findById((report as any).childId).select('parentId').lean();
      const parentId = (child as any)?.parentId;
      if (parentId && parentId.toString() !== user.userId) {
        await notify({
          recipientId: parentId,
          type: 'new_comment',
          title: `Komentar baru di "${reportTitle}"`,
          body: `${user.name} mengomentari laporan.`,
          link,
        });
      }
    }

    return SuccessResponse.ok({ comment });
  })
);
