import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Conversation } from '@/models';
import { updateConversationSchema } from '@/lib/validation/messaging';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/conversations/[id] - Retrieve a specific conversation
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const conversation = await Conversation.findById(id)
      .populate('participants.userId', 'name email avatar')
      .populate('childId', 'name')
      .populate('lastMessage', 'content messageType sentAt senderId');

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p.userId._id.toString() === user.userId && p.isActive
    );

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get user's unread count
    const userParticipant = conversation.participants.find(
      p => p.userId._id.toString() === user.userId
    );

    const conversationData = {
      ...conversation.toObject(),
      unreadCount: userParticipant?.unreadCount || 0
    };

    return NextResponse.json({
      success: true,
      data: { conversation: conversationData }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT /api/conversations/[id] - Update conversation settings
export const PUT = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url); const pathParts = url.pathname.split("/"); const id = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const validationResult = updateConversationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p.userId.toString() === user.userId && p.isActive
    );

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updateData = validationResult.data;

    // Update conversation properties
    if (updateData.title !== undefined) {
      conversation.title = updateData.title;
    }

    if (updateData.settings) {
      Object.assign(conversation.settings, updateData.settings);
    }

    conversation.updateLastActivity();
    await conversation.save();

    // Populate the response
    await conversation.populate('participants.userId', 'name email avatar');
    await conversation.populate('childId', 'name');

    return NextResponse.json({
      success: true,
      data: { conversation },
      message: 'Conversation updated successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE /api/conversations/[id] - Archive/deactivate a conversation
export const DELETE = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      p => p.userId.toString() === user.userId && p.isActive
    );

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For direct conversations, remove the user from participants
    // For group conversations, only archive if user has admin permissions
    if (conversation.type === 'direct') {
      conversation.removeParticipant(new mongoose.Types.ObjectId(user.userId));
      
      // If no active participants remain, deactivate the conversation
      const activeParticipants = conversation.participants.filter(p => p.isActive);
      if (activeParticipants.length === 0) {
        conversation.isActive = false;
      }
    } else {
      // For group conversations, user can only leave (remove themselves)
      conversation.removeParticipant(new mongoose.Types.ObjectId(user.userId));
    }

    await conversation.save();

    return NextResponse.json({
      success: true,
      message: conversation.type === 'direct' ? 'Conversation archived' : 'Left conversation'
    });

  } catch (error) {
    return handleApiError(error);
  }
});