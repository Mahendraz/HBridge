import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report } from '@/models';
import { canAccessReport } from '@/lib/utils/report-access';
import mongoose from 'mongoose';

const ALLOWED_EMOJIS = ['👍', '❤️', '🎉', '😮', '😢'];

function getReportId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('reports');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

/**
 * POST /api/reports/[id]/reactions
 * Toggle an emoji reaction for the current user on this report.
 * Body: { emoji: string }
 * If the user already reacted with that emoji, it is removed; otherwise it is added.
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) return ErrorResponse.badRequest('Invalid report ID');

    const body = await req.json();
    const emoji = (body.emoji as string | undefined)?.trim() ?? '';
    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return ErrorResponse.badRequest('Emoji tidak valid');
    }

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, isActive: true })
      .select('reactions childId therapistId')
      .lean();
    if (!report) return ErrorResponse.notFound('Report');
    if (!(await canAccessReport(report, user))) return ErrorResponse.forbidden();

    const reactions = ((report as any).reactions ?? []) as Array<{ emoji: string; userId: any }>;
    const alreadyReacted = reactions.some(
      (r) => r.emoji === emoji && r.userId?.toString() === user.userId
    );

    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database not connected');

    const userObjId = new mongoose.Types.ObjectId(user.userId);

    if (alreadyReacted) {
      await db.collection('reports').updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $pull: { reactions: { emoji, userId: userObjId } } as any }
      );
    } else {
      await db.collection('reports').updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $push: {
            reactions: { emoji, userId: userObjId, userName: user.name || '' },
          } as any,
        }
      );
    }

    const updated = await Report.findById(id).select('reactions').lean();
    return SuccessResponse.ok({ reactions: (updated as any)?.reactions ?? [] });
  })
);
