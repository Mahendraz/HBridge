import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for ConversationParticipant subdocument
export interface IConversationParticipant {
  userId: mongoose.Types.ObjectId;
  role: 'parent' | 'therapist' | 'family';
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  unreadCount: number;
  lastReadAt?: Date;
}

// Interface for Conversation document
export interface IConversation extends Document {
  participants: IConversationParticipant[];
  childId?: mongoose.Types.ObjectId;
  type: 'direct' | 'group' | 'support';
  title?: string;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isActive: boolean;
  settings: {
    allowFileSharing: boolean;
    allowVideoCall: boolean;
    messageRetention: number; // days
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  addParticipant(userId: mongoose.Types.ObjectId, role: string): void;
  removeParticipant(userId: mongoose.Types.ObjectId): void;
  updateLastActivity(): void;
  markAsRead(userId: mongoose.Types.ObjectId): void;
  incrementUnreadCount(excludeUserId?: mongoose.Types.ObjectId): void;
}

// Interface for Conversation model with static methods
export interface IConversationModel extends Model<IConversation> {
  findByUser(userId: mongoose.Types.ObjectId, type?: string): Promise<IConversation[]>;
  findByChild(childId: mongoose.Types.ObjectId): Promise<IConversation[]>;
  findDirectConversation(user1Id: mongoose.Types.ObjectId, user2Id: mongoose.Types.ObjectId): Promise<IConversation | null>;
  findActiveConversations(): Promise<IConversation[]>;
}

// ConversationParticipant schema
const ConversationParticipantSchema = new Schema<IConversationParticipant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['parent', 'therapist', 'family'],
      message: 'Role must be parent, therapist, or family'
    }
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unreadCount: {
    type: Number,
    default: 0,
    min: [0, 'Unread count cannot be negative']
  },
  lastReadAt: {
    type: Date
  }
}, { _id: false });

// Conversation schema definition
const ConversationSchema = new Schema<IConversation>({
  participants: {
    type: [ConversationParticipantSchema],
    required: [true, 'Participants are required'],
    validate: {
      validator: function(participants: IConversationParticipant[]) {
        return participants.length >= 2;
      },
      message: 'Conversation must have at least 2 participants'
    }
  },
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    index: true
  },
  type: {
    type: String,
    required: [true, 'Conversation type is required'],
    enum: {
      values: ['direct', 'group', 'support'],
      message: 'Type must be direct, group, or support'
    },
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    allowVideoCall: {
      type: Boolean,
      default: true
    },
    messageRetention: {
      type: Number,
      default: 365,
      min: [1, 'Message retention must be at least 1 day']
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  collection: 'conversations'
});

// Indexes for performance
ConversationSchema.index({ 'participants.userId': 1 });
ConversationSchema.index({ 'participants.userId': 1, isActive: 1 });
ConversationSchema.index({ type: 1, isActive: 1 });
ConversationSchema.index({ lastActivity: -1 });
ConversationSchema.index({ childId: 1, type: 1 });

// Instance method to add participant
ConversationSchema.methods.addParticipant = function(
  userId: mongoose.Types.ObjectId,
  role: string
): void {
  // Check if participant already exists
  const existingParticipant = this.participants.find(
    (p: any) => p.userId.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.leftAt = undefined;
  } else {
    this.participants.push({
      userId,
      role: role as 'parent' | 'therapist' | 'family',
      joinedAt: new Date(),
      isActive: true,
      unreadCount: 0
    });
  }
  
  this.updateLastActivity();
};

// Instance method to remove participant
ConversationSchema.methods.removeParticipant = function(
  userId: mongoose.Types.ObjectId
): void {
  const participant = this.participants.find(
    (p: any) => p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
    this.updateLastActivity();
  }
};

// Instance method to update last activity
ConversationSchema.methods.updateLastActivity = function(): void {
  this.lastActivity = new Date();
};

// Instance method to mark conversation as read for a user
ConversationSchema.methods.markAsRead = function(
  userId: mongoose.Types.ObjectId
): void {
  const participant = this.participants.find(
    (p: any) => p.userId.toString() === userId.toString()
  );
  
  if (participant) {
    participant.unreadCount = 0;
    participant.lastReadAt = new Date();
  }
};

// Instance method to increment unread count for all participants except sender
ConversationSchema.methods.incrementUnreadCount = function(
  excludeUserId?: mongoose.Types.ObjectId
): void {
  this.participants.forEach((participant: any) => {
    if (participant.isActive &&
        (!excludeUserId || participant.userId.toString() !== excludeUserId.toString())) {
      participant.unreadCount += 1;
    }
  });
};

// Static method to find conversations by user
ConversationSchema.statics.findByUser = function(
  userId: mongoose.Types.ObjectId,
  type?: string
): Promise<IConversation[]> {
  const query: any = {
    'participants.userId': userId,
    'participants.isActive': true,
    isActive: true
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('participants.userId', 'name email avatar')
    .populate('childId', 'name')
    .populate('lastMessage', 'content messageType sentAt senderId')
    .sort({ lastActivity: -1 });
};

// Static method to find conversations by child
ConversationSchema.statics.findByChild = function(
  childId: mongoose.Types.ObjectId
): Promise<IConversation[]> {
  return this.find({ childId, isActive: true })
    .populate('participants.userId', 'name email role')
    .sort({ lastActivity: -1 });
};

// Static method to find direct conversation between two users
ConversationSchema.statics.findDirectConversation = function(
  user1Id: mongoose.Types.ObjectId,
  user2Id: mongoose.Types.ObjectId
): Promise<IConversation | null> {
  return this.findOne({
    type: 'direct',
    isActive: true,
    'participants.userId': { $all: [user1Id, user2Id] },
    'participants.isActive': true
  })
    .populate('participants.userId', 'name email avatar');
};

// Static method to find active conversations
ConversationSchema.statics.findActiveConversations = function(): Promise<IConversation[]> {
  return this.find({ isActive: true })
    .populate('participants.userId', 'name email')
    .populate('childId', 'name')
    .sort({ lastActivity: -1 });
};

// Pre-save middleware for validation
ConversationSchema.pre('save', function() {
  // Ensure direct conversations have exactly 2 participants
  if (this.type === 'direct') {
    const activeParticipants = this.participants.filter(p => p.isActive);
    if (activeParticipants.length !== 2) {
      throw new Error('Direct conversations must have exactly 2 active participants');
    }
  }
  
  // Ensure group conversations have a title if more than 2 participants
  if (this.type === 'group') {
    const activeParticipants = this.participants.filter(p => p.isActive);
    if (activeParticipants.length > 2 && !this.title) {
      throw new Error('Group conversations with more than 2 participants must have a title');
    }
  }
  
  // Validate participant uniqueness
  const userIds = this.participants.map(p => p.userId.toString());
  const uniqueUserIds = new Set(userIds);
  if (userIds.length !== uniqueUserIds.size) {
    throw new Error('Conversation cannot have duplicate participants');
  }
});

// Create and export the Conversation model
const Conversation = (mongoose.models.Conversation as IConversationModel) || 
  mongoose.model<IConversation, IConversationModel>('Conversation', ConversationSchema);

export default Conversation;