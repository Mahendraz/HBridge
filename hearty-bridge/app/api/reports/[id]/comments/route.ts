import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report, Child, User } from '@/models';
import ReportComment from '@/models/ReportComment';
import mongoose from 'mongoose';
import { canAccessReport as canAccess } from '@/lib/utils/report-access';
import { notify } from '@/lib/utils/notify';
import { logActivity } from '@/lib/utils/audit-log';

function getReportId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('reports');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

/**
 * GET /api/reports/[id]/comments
 * Returns all active comments on the report, sorted newest-first (ADM-7).
 * The report view re-sorts replies oldest-first within each thread.
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
      .sort({ createdAt: -1 })
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

    // A reply must hang off a comment of this same report.
    if (parentCommentId) {
      const parentExists = await ReportComment.exists({
        _id: parentCommentId,
        reportId: new mongoose.Types.ObjectId(id),
        isActive: true,
      });
      if (!parentExists) return ErrorResponse.badRequest('Komentar yang dibalas tidak ditemukan');
    }

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

      // Admins follow up on parent comments too, and use the bell (newest
      // first) to see which parent commented most recently.
      const admins = await User.find({ role: { $in: ['admin', 'super_admin'] }, isActive: true })
        .select('_id')
        .lean();
      await Promise.all(
        admins.map((admin) =>
          notify({
            recipientId: admin._id,
            type: 'new_comment',
            title: `Komentar ortu di "${reportTitle}"`,
            body: `${user.name} (${(report as any).childName || 'anak'}) mengomentari laporan.`,
            link,
          })
        )
      );
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

    logActivity(req, {
      category: 'report',
      action: parentCommentId ? 'report.comment_replied' : 'report.comment_added',
      title: `${parentCommentId ? 'Balasan komentar' : 'Komentar baru'} — ${(report as { childName?: string }).childName || 'laporan'}`,
      description: reportTitle,
      actor: user,
      target: { type: 'report', id, name: reportTitle },
      metadata: { commentId: comment._id.toString(), ...(parentCommentId && { parentCommentId: parentCommentId.toString() }) },
    });

    return SuccessResponse.ok({ comment });
  })
);
