import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Conversation, Message } from '@/models';
import { markAsReadSchema } from '@/lib/validation/messaging';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/conversations/[id]/read - Mark messages as read
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const body = await request.json();
    body.conversationId = id; // Ensure conversationId matches route param
    
    const validationResult = markAsReadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Check if user is a participant in the conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(
      p => p.userId.toString() === user.userId && p.isActive
    );

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { messageIds } = validationResult.data;

    let messages;
    
    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      messages = await Message.find({
        _id: { $in: messageIds },
        conversationId: id,
        senderId: { $ne: user.userId }, // Don't mark own messages
        deletedAt: { $exists: false }
      });
    } else {
      // Mark all unread messages as read
      messages = await Message.find({
        conversationId: id,
        senderId: { $ne: user.userId }, // Don't mark own messages
        'readBy.userId': { $ne: user.userId }, // Not already read by user
        deletedAt: { $exists: false }
      });
    }

    let markedCount = 0;
    
    for (const message of messages) {
      if (!message.isReadByUser(new mongoose.Types.ObjectId(user.userId))) {
        message.markAsRead(new mongoose.Types.ObjectId(user.userId));
        await message.save();
        markedCount++;
      }
    }

    // Update conversation unread count for the user
    conversation.markAsRead(new mongoose.Types.ObjectId(user.userId));
    await conversation.save();

    return NextResponse.json({
      success: true,
      data: { 
        markedCount,
        conversationId: id
      },
      message: `Marked ${markedCount} messages as read`
    });

  } catch (error) {
    return handleApiError(error);
  }
});