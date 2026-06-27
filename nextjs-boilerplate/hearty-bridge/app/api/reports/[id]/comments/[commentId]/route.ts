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

function getCommentId(req: NextRequest): string {
  return new URL(req.url).pathname.split('/').at(-1) ?? '';
}

/**
 * PATCH /api/reports/[id]/comments/[commentId]
 * - { isResolved: boolean } — therapist (own report) or admin only
 * - { text: string }       — own comment, within 15 min of creation
 */
export const PATCH = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const reportId   = getReportId(req);
    const commentId  = getCommentId(req);

    if (!mongoose.Types.ObjectId.isValid(reportId))  return ErrorResponse.badRequest('Invalid report ID');
    if (!mongoose.Types.ObjectId.isValid(commentId)) return ErrorResponse.badRequest('Invalid comment ID');

    await connectToDatabase();

    const [report, comment] = await Promise.all([
      Report.findOne({ _id: reportId, isActive: true }).lean(),
      ReportComment.findOne({ _id: commentId, reportId: new mongoose.Types.ObjectId(reportId), isActive: true }).lean(),
    ]);

    if (!report)  return ErrorResponse.notFound('Report');
    if (!comment) return ErrorResponse.notFound('Comment');

    const body = await req.json();
    const update: Record<string, unknown> = {};

    if ('isResolved' in body) {
      const canResolve =
        user.role === 'admin' || user.role === 'super_admin' ||
        (user.role === 'therapist' && (report as any).therapistId?.toString() === user.userId);
      if (!canResolve) return ErrorResponse.forbidden();

      update.isResolved = Boolean(body.isResolved);
      if (body.isResolved) {
        update.resolvedAt     = new Date();
        update.resolvedById   = new mongoose.Types.ObjectId(user.userId);
        update.resolvedByName = user.name || '';
      } else {
        update.resolvedAt   = null;
        update.resolvedById = null;
        update.resolvedByName = '';
      }
    }

    if ('text' in body) {
      if ((comment as any).authorId?.toString() !== user.userId) return ErrorResponse.forbidden();
      const createdAt = new Date((comment as any).createdAt).getTime();
      if (Date.now() - createdAt > 15 * 60 * 1000) {
        return ErrorResponse.badRequest('Komentar hanya bisa diedit dalam 15 menit setelah dibuat');
      }
      const text = (body.text as string).trim();
      if (!text) return ErrorResponse.badRequest('Komentar tidak boleh kosong');
      if (text.length > 1000) return ErrorResponse.badRequest('Komentar maksimal 1000 karakter');
      update.text = text;
    }

    if (Object.keys(update).length === 0) return ErrorResponse.badRequest('Tidak ada field yang diubah');

    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database not connected');

    const updated = await db.collection('report_comments').findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(commentId) },
      { $set: update },
      { returnDocument: 'after' }
    );

    return SuccessResponse.ok({ comment: updated });
  })
);

/**
 * DELETE /api/reports/[id]/comments/[commentId]
 * Soft-delete. Only author or admin.
 */
export const DELETE = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const reportId  = getReportId(req);
    const commentId = getCommentId(req);

    if (!mongoose.Types.ObjectId.isValid(reportId))  return ErrorResponse.badRequest('Invalid report ID');
    if (!mongoose.Types.ObjectId.isValid(commentId)) return ErrorResponse.badRequest('Invalid comment ID');

    await connectToDatabase();

    const comment = await ReportComment.findOne({
      _id: commentId,
      reportId: new mongoose.Types.ObjectId(reportId),
      isActive: true,
    }).lean();

    if (!comment) return ErrorResponse.notFound('Comment');

    const canDelete =
      user.role === 'admin' || user.role === 'super_admin' ||
      (comment as any).authorId?.toString() === user.userId;
    if (!canDelete) return ErrorResponse.forbidden();

    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database not connected');

    await db.collection('report_comments').updateOne(
      { _id: new mongoose.Types.ObjectId(commentId) },
      { $set: { isActive: false } }
    );

    return SuccessResponse.ok({ message: 'Komentar dihapus' });
  })
);
