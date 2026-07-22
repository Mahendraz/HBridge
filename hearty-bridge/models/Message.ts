import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for MessageReaction subdocument
export interface IMessageReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

// Interface for MessageReadStatus subdocument
export interface IMessageReadStatus {
  userId: mongoose.Types.ObjectId;
  readAt: Date;
}

// Interface for Message document
export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system';
  attachments: mongoose.Types.ObjectId[];
  replyTo?: mongoose.Types.ObjectId;
  reactions: IMessageReaction[];
  status: 'sent' | 'delivered' | 'read';
  readBy: IMessageReadStatus[];
  isEncrypted: boolean;
  sentAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
  metadata?: {
    fileSize?: number;
    duration?: number;
    systemEventType?: string;
    editHistory?: {
      content: string;
      editedAt: Date;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
  addReaction(userId: mongoose.Types.ObjectId, emoji: string): void;
  removeReaction(userId: mongoose.Types.ObjectId, emoji?: string): void;
  markAsRead(userId: mongoose.Types.ObjectId): void;
  isReadByUser(userId: mongoose.Types.ObjectId): boolean;
  getReadCount(): number;
}

// Interface for Message model with static methods
export interface IMessageModel extends Model<IMessage> {
  findByConversation(conversationId: mongoose.Types.ObjectId, limit?: number, offset?: number): Promise<IMessage[]>;
  findBySender(senderId: mongoose.Types.ObjectId): Promise<IMessage[]>;
  findUnreadMessages(userId: mongoose.Types.ObjectId): Promise<IMessage[]>;
  searchMessages(conversationId: mongoose.Types.ObjectId, searchTerm: string): Promise<IMessage[]>;
  getConversationStats(conversationId: mongoose.Types.ObjectId): Promise<any>;
}

// MessageReaction schema
const MessageReactionSchema = new Schema<IMessageReaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  emoji: {
    type: String,
    required: [true, 'Emoji is required'],
    trim: true,
    maxlength: [10, 'Emoji cannot exceed 10 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// MessageReadStatus schema
const MessageReadStatusSchema = new Schema<IMessageReadStatus>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  readAt: {
    type: Date,
    required: [true, 'Read time is required']
  }
}, { _id: false });

// Message schema definition
const MessageSchema = new Schema<IMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation ID is required'],
    index: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required'],
    index: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
  },
  messageType: {
    type: String,
    required: [true, 'Message type is required'],
    enum: {
      values: ['text', 'image', 'video', 'audio', 'document', 'system'],
      message: 'Message type must be text, image, video, audio, document, or system'
    },
    index: true
  },
  attachments: [{
    type: Schema.Types.ObjectId,
    ref: 'MediaFile'
  }],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  reactions: [MessageReactionSchema],
  status: {
    type: String,
    enum: {
      values: ['sent', 'delivered', 'read'],
      message: 'Status must be sent, delivered, or read'
    },
    default: 'sent',
    index: true
  },
  readBy: [MessageReadStatusSchema],
  isEncrypted: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  editedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
  },
  metadata: {
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative']
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    systemEventType: {
      type: String,
      trim: true
    },
    editHistory: [{
      content: {
        type: String,
        required: true
      },
      editedAt: {
        type: Date,
        required: true
      }
    }]
  }
}, {
  timestamps: true,
  collection: 'messages'
});

// Indexes for performance
MessageSchema.index({ conversationId: 1, sentAt: -1 });
MessageSchema.index({ senderId: 1, sentAt: -1 });
MessageSchema.index({ messageType: 1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ 'readBy.userId': 1 });
MessageSchema.index({ deletedAt: 1 });

// Text index for search
MessageSchema.index({
  content: 'text'
});

// Compound indexes for common queries
MessageSchema.index({ conversationId: 1, deletedAt: 1, sentAt: -1 });

// Instance method to add reaction
MessageSchema.methods.addReaction = function(
  userId: mongoose.Types.ObjectId,
  emoji: string
): void {
  // Remove existing reaction from same user with same emoji
  this.reactions = this.reactions.filter(
    (r: any) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
  );
  
  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date()
  });
};

// Instance method to remove reaction
MessageSchema.methods.removeReaction = function(
  userId: mongoose.Types.ObjectId,
  emoji?: string
): void {
  if (emoji) {
    // Remove specific emoji reaction
    this.reactions = this.reactions.filter(
      (r: any) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );
  } else {
    // Remove all reactions from user
    this.reactions = this.reactions.filter(
      (r: any) => r.userId.toString() !== userId.toString()
    );
  }
};

// Instance method to mark as read by user
MessageSchema.methods.markAsRead = function(
  userId: mongoose.Types.ObjectId
): void {
  // Remove existing read status for this user
  this.readBy = this.readBy.filter(
    (r: any) => r.userId.toString() !== userId.toString()
  );
  
  // Add new read status
  this.readBy.push({
    userId,
    readAt: new Date()
  });
  
  // Update status if not already read
  if (this.status !== 'read') {
    this.status = 'read';
  }
};

// Instance method to check if message is read by user
MessageSchema.methods.isReadByUser = function(
  userId: mongoose.Types.ObjectId
): boolean {
  return this.readBy.some(
    (r: any) => r.userId.toString() === userId.toString()
  );
};

// Instance method to get read count
MessageSchema.methods.getReadCount = function(): number {
  return this.readBy.length;
};

// Static method to find messages by conversation
MessageSchema.statics.findByConversation = function(
  conversationId: mongoose.Types.ObjectId,
  limit: number = 50,
  offset: number = 0
): Promise<IMessage[]> {
  return this.find({
    conversationId,
    deletedAt: { $exists: false }
  })
    .populate('senderId', 'name avatar')
    .populate('attachments')
    .populate('replyTo', 'content senderId messageType')
    .sort({ sentAt: -1 })
    .skip(offset)
    .limit(limit);
};

// Static method to find messages by sender
MessageSchema.statics.findBySender = function(
  senderId: mongoose.Types.ObjectId
): Promise<IMessage[]> {
  return this.find({
    senderId,
    deletedAt: { $exists: false }
  })
    .populate('conversationId', 'title type')
    .sort({ sentAt: -1 });
};

// Static method to find unread messages for a user
MessageSchema.statics.findUnreadMessages = function(
  userId: mongoose.Types.ObjectId
): Promise<IMessage[]> {
  return this.find({
    senderId: { $ne: userId },
    'readBy.userId': { $ne: userId },
    deletedAt: { $exists: false }
  })
    .populate('senderId', 'name avatar')
    .populate('conversationId', 'title type')
    .sort({ sentAt: -1 });
};

// Static method to search messages in a conversation
MessageSchema.statics.searchMessages = function(
  conversationId: mongoose.Types.ObjectId,
  searchTerm: string
): Promise<IMessage[]> {
  return this.find({
    conversationId,
    $text: { $search: searchTerm },
    deletedAt: { $exists: false }
  })
    .populate('senderId', 'name avatar')
    .sort({ score: { $meta: 'textScore' }, sentAt: -1 });
};

// Static method to get conversation statistics
MessageSchema.statics.getConversationStats = function(
  conversationId: mongoose.Types.ObjectId
): Promise<any> {
  return this.aggregate([
    {
      $match: {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        deletedAt: { $exists: false }
      }
    },
    {
      $group: {
        _id: '$conversationId',
        totalMessages: { $sum: 1 },
        messagesByType: {
          $push: {
            type: '$messageType',
            count: 1
          }
        },
        lastMessage: { $max: '$sentAt' },
        participants: { $addToSet: '$senderId' }
      }
    }
  ]);
};

// Pre-save middleware for validation
MessageSchema.pre('save', function() {
  // Validate that text messages have content
  if (this.messageType === 'text' && !this.content) {
    throw new Error('Text messages must have content');
  }
  
  // Validate that media messages have attachments
  if (['image', 'video', 'audio', 'document'].includes(this.messageType) && 
      this.attachments.length === 0) {
    throw new Error('Media messages must have attachments');
  }
  
  // Validate reply structure
  if (this.replyTo && this.replyTo.toString() === this._id.toString()) {
    throw new Error('Message cannot reply to itself');
  }
  
  // Set delivered status for new messages
  if (this.isNew && this.status === 'sent') {
    this.status = 'delivered';
  }
});

// Pre-save middleware to handle edit history
MessageSchema.pre('save', function() {
  if (this.isModified('content') && !this.isNew && this.content) {
    if (!this.metadata) {
      this.metadata = {};
    }
    if (!this.metadata.editHistory) {
      this.metadata.editHistory = [];
    }
    
    this.metadata.editHistory.push({
      content: this.content,
      editedAt: new Date()
    });
    this.editedAt = new Date();
  }
});

// Create and export the Message model
const Message = (mongoose.models.Message as IMessageModel) || 
  mongoose.model<IMessage, IMessageModel>('Message', MessageSchema);

export default Message;