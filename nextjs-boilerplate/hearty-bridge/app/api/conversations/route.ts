import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Conversation, User } from '@/models';
import { createConversationSchema, conversationQuerySchema } from '@/lib/validation/messaging';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

// GET /api/conversations - Retrieve conversations for the authenticated user
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    
    // Build query params object, only include defined values
    const queryParams: any = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      includeArchived: searchParams.get('includeArchived') === 'true'
    };
    
    // Only add optional parameters if they exist
    const type = searchParams.get('type');
    if (type) queryParams.type = type;
    
    const childId = searchParams.get('childId');
    if (childId) queryParams.childId = childId;

    const validationResult = conversationQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Build base query
    const query: any = {
      'participants.userId': new mongoose.Types.ObjectId(user.userId),
      'participants.isActive': true
    };

    if (!validatedData.includeArchived) {
      query.isActive = true;
    }

    if (validatedData.type) {
      query.type = validatedData.type;
    }

    if (validatedData.childId) {
      query.childId = new mongoose.Types.ObjectId(validatedData.childId);
    }

    const conversations = await Conversation.find(query)
      .populate('participants.userId', 'name email avatar')
      .populate('childId', 'name')
      .populate('lastMessage', 'content messageType sentAt senderId')
      .sort({ lastActivity: -1 })
      .skip(validatedData.offset)
      .limit(validatedData.limit);

    const total = await Conversation.countDocuments(query);

    // Add unread count for each conversation
    const conversationsWithUnread = conversations.map(conv => {
      const userParticipant = conv.participants.find(
        p => p.userId._id.toString() === user.userId
      );
      
      return {
        ...conv.toObject(),
        unreadCount: userParticipant?.unreadCount || 0
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversationsWithUnread,
        pagination: {
          total,
          limit: validatedData.limit,
          offset: validatedData.offset,
          hasMore: validatedData.offset + validatedData.limit < total
        }
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/conversations - Create a new conversation
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const body = await request.json();
    
    const validationResult = createConversationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { participantIds, type, title, childId, settings } = validationResult.data;

    // Verify all participants exist
    const participants = await User.find({ 
      _id: { $in: participantIds }, 
      isActive: true 
    });
    
    if (participants.length !== participantIds.length) {
      return NextResponse.json({ 
        error: 'One or more participants not found or inactive' 
      }, { status: 400 });
    }

    // Ensure the current user is included in participants
    if (!participantIds.includes(user.userId)) {
      participantIds.push(user.userId);
    }

    // For direct conversations, check if one already exists
    if (type === 'direct' && participantIds.length === 2) {
      const existingConversation = await Conversation.findDirectConversation(
        new mongoose.Types.ObjectId(participantIds[0]),
        new mongoose.Types.ObjectId(participantIds[1])
      );
      
      if (existingConversation) {
        return NextResponse.json({
          success: true,
          data: { conversation: existingConversation },
          message: 'Direct conversation already exists'
        });
      }
    }

    // Create participant objects
    const conversationParticipants = participantIds.map(participantId => {
      const participant = participants.find(p => p._id.toString() === participantId);
      return {
        userId: new mongoose.Types.ObjectId(participantId),
        role: participant?.role === 'therapist' ? 'therapist' : 
              participant?.role === 'parent' ? 'parent' : 'family',
        joinedAt: new Date(),
        isActive: true,
        unreadCount: 0
      };
    });

    const conversation = new Conversation({
      participants: conversationParticipants,
      type,
      title,
      childId: childId ? new mongoose.Types.ObjectId(childId) : undefined,
      isActive: true,
      settings: {
        allowFileSharing: settings?.allowFileSharing ?? true,
        allowVideoCall: settings?.allowVideoCall ?? true,
        messageRetention: settings?.messageRetention ?? 365,
        notifications: settings?.notifications ?? true
      }
    });

    await conversation.save();

    // Populate the response
    await conversation.populate('participants.userId', 'name email avatar');
    if (childId) {
      await conversation.populate('childId', 'name');
    }

    return NextResponse.json({
      success: true,
      data: { conversation },
      message: 'Conversation created successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});