import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Message, Conversation } from '@/models';
import { updateMessageSchema, addReactionSchema } from '@/lib/validation/messaging';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
    messageId: string;
  };
}

// GET /api/conversations/[id]/messages/[messageId] - Retrieve a specific message
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 3];
    const messageId = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: 'Invalid conversation or message ID' }, { status: 400 });
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

    const message = await Message.findOne({
      _id: messageId,
      conversationId: id,
      deletedAt: { $exists: false }
    })
      .populate('senderId', 'name avatar')
      .populate('attachments')
      .populate('replyTo', 'content senderId messageType')
      .populate('reactions.userId', 'name');

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { message }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/conversations/[id]/messages/[messageId] - Update a message
export const PUT = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 3];
    const messageId = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: 'Invalid conversation or message ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = updateMessageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const message = await Message.findOne({
      _id: messageId,
      conversationId: id,
      deletedAt: { $exists: false }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender or has admin permissions
    const canEdit = message.senderId.toString() === user.userId || user.role === 'admin';

    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData = validationResult.data;

    // Update message properties
    if (updateData.content !== undefined) {
      message.content = updateData.content;
    }

    if (updateData.attachmentIds !== undefined) {
      message.attachments = updateData.attachmentIds.map(id => new mongoose.Types.ObjectId(id));
    }

    await message.save();

    // Populate the response
    await message.populate('senderId', 'name avatar');
    await message.populate('attachments');
    await message.populate('replyTo', 'content senderId messageType');

    return NextResponse.json({
      success: true,
      data: { message },
      message: 'Message updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/conversations/[id]/messages/[messageId] - Delete a message
export const DELETE = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 3];
    const messageId = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: 'Invalid conversation or message ID' }, { status: 400 });
    }

    const message = await Message.findOne({
      _id: messageId,
      conversationId: id,
      deletedAt: { $exists: false }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is the sender or has admin permissions
    const canDelete = message.senderId.toString() === user.userId || user.role === 'admin';

    if (!canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft delete the message
    message.deletedAt = new Date();
    await message.save();

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});