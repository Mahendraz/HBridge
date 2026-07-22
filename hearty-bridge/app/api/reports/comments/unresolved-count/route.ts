import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import ReportComment from '@/models/ReportComment';
import mongoose from 'mongoose';

/**
 * GET /api/reports/comments/unresolved-count
 * Returns the number of unresolved root-level comments the current user needs to act on.
 *   admin     → all unresolved root comments
 *   therapist → unresolved root comments on their own reports
 *   parent    → always 0 (no notification badge for parents)
 */
export const GET = withAnyAuth(
  withErrorHandling(async (_req: NextRequest, user: any) => {
    if (user.role === 'parent') {
      return SuccessResponse.ok({ count: 0 });
    }

    await connectToDatabase();

    const query: Record<string, any> = {
      isResolved: false,
      isActive: true,
      parentCommentId: null,
    };

    if (user.role === 'therapist') {
      query.therapistId = new mongoose.Types.ObjectId(user.userId);
    }

    const count = await ReportComment.countDocuments(query);
    return SuccessResponse.ok({ count });
  })
);
