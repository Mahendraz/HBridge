import Notification from '@/models/Notification';
import mongoose from 'mongoose';

/**
 * Fire-and-forget notification creation. Never throws — a failure here
 * (e.g. transient DB hiccup) must not fail the primary action (comment
 * posted, invoice updated, report created) that triggered it.
 */
export async function notify(params: {
  recipientId: string | mongoose.Types.ObjectId;
  type: 'new_invoice' | 'new_comment' | 'new_report';
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  try {
    await Notification.create({
      recipientId: new mongoose.Types.ObjectId(params.recipientId.toString()),
      type: params.type,
      title: params.title,
      body: params.body ?? '',
      link: params.link ?? '',
      isRead: false,
    });
  } catch (err) {
    console.error('[notify] failed to create notification:', err);
  }
}
