import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

function getNotificationId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('notifications');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

/**
 * PATCH /api/notifications/[id]/read
 * Marks a single notification as read. Only the recipient may do this.
 */
export const PATCH = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getNotificationId(req);
    if (!mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('Invalid notification ID');

    await connectToDatabase();

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: new mongoose.Types.ObjectId(user.userId) },
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!notification) return ErrorResponse.notFound('Notification');

    return SuccessResponse.ok({ notification });
  })
);
