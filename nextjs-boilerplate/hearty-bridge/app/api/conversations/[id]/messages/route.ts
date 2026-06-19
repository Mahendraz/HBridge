import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { Conversation, Message, MediaFile } from '@/models';
import { sendMessageSchema, messageQuerySchema } from '@/lib/validation/messaging';
import connectToDatabase from '@/lib/db/mongodb';
import { handleApiError } from '@/lib/utils/error-handler';
import mongoose from 'mongoose';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/conversations/[id]/messages - Retrieve messages for a conversation
export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Fixed: messages is the last part, conversation id is second to last

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    
    // Build query params object, only include defined values
    const queryParams: any = {
      conversationId: id,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };
    
    // Only add optional parameters if they exist
    const messageType = searchParams.get('messageType');
    if (messageType) queryParams.messageType = messageType;
    
    const startDate = searchParams.get('startDate');
    if (startDate) queryParams.startDate = startDate;
    
    const endDate = searchParams.get('endDate');
    if (endDate) queryParams.endDate = endDate;

    const validationResult = messageQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.issues },
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

    const validatedData = validationResult.data;

    // Build query
    const query: any = {
      conversationId: new mongoose.Types.ObjectId(id),
      deletedAt: { $exists: false }
    };

    if (validatedData.messageType) {
      query.messageType = validatedData.messageType;
    }

    if (validatedData.startDate || validatedData.endDate) {
      query.sentAt = {};
      if (validatedData.startDate) query.sentAt.$gte = new Date(validatedData.startDate);
      if (validatedData.endDate) query.sentAt.$lte = new Date(validatedData.endDate);
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name avatar')
      .populate('attachments')
      .populate('replyTo', 'content senderId messageType')
      .sort({ sentAt: -1 })
      .skip(validatedData.offset)
      .limit(validatedData.limit);

    const total = await Message.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        messages,
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

// POST /api/conversations/[id]/messages - Send a new message
export const POST = withAnyAuth(async (request: NextRequest, user: any) => {
  try {

    await connectToDatabase();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Fixed: messages is the last part, conversation id is second to last

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const body = await request.json();
    body.conversationId = id; // Ensure conversationId matches route param
    
    const validationResult = sendMessageSchema.safeParse(body);
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

    const {
      content,
      messageType,
      attachmentIds,
      replyToMessageId,
      metadata
    } = validationResult.data;

    // Validate attachments if provided
    if (attachmentIds && attachmentIds.length > 0) {
      const attachments = await MediaFile.find({
        _id: { $in: attachmentIds }
      });
      
      if (attachments.length !== attachmentIds.length) {
        return NextResponse.json({ 
          error: 'One or more attachments not found' 
        }, { status: 400 });
      }
    }

    // Validate reply message if provided
    if (replyToMessageId) {
      const replyMessage = await Message.findOne({
        _id: replyToMessageId,
        conversationId: id
      });
      
      if (!replyMessage) {
        return NextResponse.json({ 
          error: 'Reply message not found in this conversation' 
        }, { status: 400 });
      }
    }

    // Create the message
    const message = new Message({
      conversationId: new mongoose.Types.ObjectId(id),
      senderId: new mongoose.Types.ObjectId(user.userId),
      content,
      messageType,
      attachments: attachmentIds?.map(id => new mongoose.Types.ObjectId(id)) || [],
      replyTo: replyToMessageId ? new mongoose.Types.ObjectId(replyToMessageId) : undefined,
      status: 'sent',
      isEncrypted: false,
      metadata: metadata || {}
    });

    await message.save();

    // Update conversation's last message and activity
    conversation.lastMessage = message._id as mongoose.Types.ObjectId;
    conversation.updateLastActivity();
    
    // Increment unread count for other participants
    conversation.incrementUnreadCount(new mongoose.Types.ObjectId(user.userId));
    
    await conversation.save();

    // Populate the response
    await message.populate('senderId', 'name avatar');
    await message.populate('attachments');
    if (replyToMessageId) {
      await message.populate('replyTo', 'content senderId messageType');
    }

    return NextResponse.json({
      success: true,
      data: { message },
      message: 'Message sent successfully'
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});