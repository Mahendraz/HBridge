import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Message, Conversation } from '@/models';
import { addReactionSchema } from '@/lib/validation/messaging';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
    messageId: string;
  };
}

// POST /api/conversations/[id]/messages/[messageId]/reactions - Add a reaction to a message
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 4];
    const messageId = pathParts[pathParts.length - 2];

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: 'Invalid conversation or message ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = addReactionSchema.safeParse(body);
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

    const message = await Message.findOne({
      _id: messageId,
      conversationId: id,
      deletedAt: { $exists: false }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const { emoji } = validationResult.data;

    // Add the reaction
    message.addReaction(new mongoose.Types.ObjectId(user.userId), emoji);
    await message.save();

    return NextResponse.json({
      success: true,
      data: { 
        reactions: message.reactions,
        messageId: message._id 
      },
      message: 'Reaction added successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/conversations/[id]/messages/[messageId]/reactions - Remove a reaction from a message
export const DELETE = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 4];
    const messageId = pathParts[pathParts.length - 2];

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
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get emoji from query params
    const { searchParams } = new URL(request.url);
    const emoji = searchParams.get('emoji');

    // Remove the reaction
    if (emoji) {
      message.removeReaction(new mongoose.Types.ObjectId(user.userId), emoji);
    } else {
      // Remove all reactions from the user
      message.removeReaction(new mongoose.Types.ObjectId(user.userId));
    }
    
    await message.save();

    return NextResponse.json({
      success: true,
      data: { 
        reactions: message.reactions,
        messageId: message._id 
      },
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});