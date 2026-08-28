import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

/**
 * GET /api/notifications?unread=true&limit=20
 * Returns the current user's notifications, newest first.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const unreadOnly = params.get('unread') === 'true';
    const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') || '20', 10)));

    const query: Record<string, unknown> = { recipientId: new mongoose.Types.ObjectId(user.userId) };
    if (unreadOnly) query.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ recipientId: new mongoose.Types.ObjectId(user.userId), isRead: false }),
    ]);

    return SuccessResponse.ok({ notifications, unreadCount });
  })
);

/**
 * PATCH /api/notifications
 * Body: { markAllRead: true } — marks all of the current user's unread notifications as read.
 */
export const PATCH = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    if (body?.markAllRead) {
      await Notification.updateMany(
        { recipientId: new mongoose.Types.ObjectId(user.userId), isRead: false },
        { $set: { isRead: true } }
      );
    }

    return SuccessResponse.ok({});
  })
);
