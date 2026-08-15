import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { Report } from '@/models';
import { canAccessReport } from '@/lib/utils/report-access';
import mongoose from 'mongoose';

function getReportId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('reports');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

/**
 * POST /api/reports/[id]/seen
 * Mark the report as seen by the current user.
 * Upserts: removes the existing seenBy entry for this user then pushes an updated one.
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getReportId(req);
    if (!mongoose.Types.ObjectId.isValid(id)) return ErrorResponse.badRequest('Invalid report ID');

    await connectToDatabase();

    const report = await Report.findOne({ _id: id, isActive: true })
      .select('childId therapistId')
      .lean();
    if (!report) return ErrorResponse.notFound('Report');
    if (!(await canAccessReport(report, user))) return ErrorResponse.forbidden();

    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database not connected');

    const userObjId = new mongoose.Types.ObjectId(user.userId);

    await db.collection('reports').updateOne(
      { _id: new mongoose.Types.ObjectId(id), isActive: true },
      {
        $pull: { seenBy: { userId: userObjId } } as any,
      }
    );

    await db.collection('reports').updateOne(
      { _id: new mongoose.Types.ObjectId(id), isActive: true },
      {
        $push: {
          seenBy: {
            userId:   userObjId,
            userName: user.name || '',
            role:     user.role,
            seenAt:   new Date(),
          },
        } as any,
      }
    );

    return SuccessResponse.ok({ success: true });
  })
);
