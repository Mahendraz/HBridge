import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for SearchIndex document
export interface ISearchIndex extends Document {
  entityType: 'child' | 'user' | 'document' | 'message' | 'milestone';
  entityId: mongoose.Types.ObjectId;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
  permissions: {
    viewableBy: mongoose.Types.ObjectId[];
    roles: ('parent' | 'therapist' | 'family')[];
  };
  lastIndexed: Date;
  searchVector?: number[];
  relevanceScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for ActivityLog document
export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

// Interface for SearchIndex model with static methods
export interface ISearchIndexModel extends Model<ISearchIndex> {
  searchContent(
    query: string,
    entityTypes?: string[],
    userId?: mongoose.Types.ObjectId,
    limit?: number
  ): Promise<ISearchIndex[]>;
  indexEntity(
    entityType: string,
    entityId: mongoose.Types.ObjectId,
    content: string,
    tags?: string[],
    metadata?: Record<string, any>
  ): Promise<ISearchIndex>;
  removeEntityFromIndex(entityId: mongoose.Types.ObjectId): Promise<void>;
  updateEntityIndex(
    entityId: mongoose.Types.ObjectId,
    content: string,
    tags?: string[],
    metadata?: Record<string, any>
  ): Promise<ISearchIndex | null>;
}

// Interface for ActivityLog model with static methods
export interface IActivityLogModel extends Model<IActivityLog> {
  logActivity(
    userId: mongoose.Types.ObjectId,
    action: string,
    entityType: string,
    entityId: mongoose.Types.ObjectId,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IActivityLog>;
  getUserActivity(
    userId: mongoose.Types.ObjectId,
    limit?: number,
    offset?: number
  ): Promise<IActivityLog[]>;
  getEntityActivity(
    entityType: string,
    entityId: mongoose.Types.ObjectId
  ): Promise<IActivityLog[]>;
  getSecurityLogs(
    startDate?: Date,
    endDate?: Date
  ): Promise<IActivityLog[]>;
}

// SearchIndex schema definition
const SearchIndexSchema = new Schema<ISearchIndex>({
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: ['child', 'user', 'document', 'message', 'milestone'],
      message: 'Entity type must be child, user, document, message, or milestone'
    },
    index: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Entity ID is required'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    text: true // Enable text search
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  permissions: {
    viewableBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    roles: [{
      type: String,
      enum: ['parent', 'therapist', 'family']
    }]
  },
  lastIndexed: {
    type: Date,
    default: Date.now,
    index: true
  },
  searchVector: [{
    type: Number
  }],
  relevanceScore: {
    type: Number,
    min: [0, 'Relevance score cannot be negative'],
    max: [1, 'Relevance score cannot exceed 1']
  }
}, {
  timestamps: true,
  collection: 'searchindex'
});

// Indexes for performance
SearchIndexSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
SearchIndexSchema.index({ tags: 1 });
SearchIndexSchema.index({ 'permissions.viewableBy': 1 });
SearchIndexSchema.index({ 'permissions.roles': 1 });
SearchIndexSchema.index({ lastIndexed: -1 });

// Text index for full-text search
SearchIndexSchema.index({
  content: 'text',
  tags: 'text'
});

// ActivityLog schema definition
const ActivityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    maxlength: [100, 'Action cannot exceed 100 characters'],
    index: true
  },
  entityType: {
    type: String,
    required: [true, 'Entity type is required'],
    trim: true,
    maxlength: [50, 'Entity type cannot exceed 50 characters'],
    index: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Entity ID is required'],
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: [true, 'IP address is required'],
    trim: true,
    index: true
  },
  userAgent: {
    type: String,
    required: [true, 'User agent is required'],
    trim: true,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String,
    trim: true,
    index: true
  },
  success: {
    type: Boolean,
    required: [true, 'Success status is required'],
    default: true,
    index: true
  },
  errorMessage: {
    type: String,
    trim: true,
    maxlength: [1000, 'Error message cannot exceed 1000 characters']
  }
}, {
  timestamps: false, // We use custom timestamp field
  collection: 'activitylogs'
});

// Indexes for ActivityLog performance
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ success: 1, timestamp: -1 });
ActivityLogSchema.index({ ipAddress: 1, timestamp: -1 });

// TTL index to auto-remove old logs (90 days)
ActivityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// SearchIndex static methods

// Static method to search content
SearchIndexSchema.statics.searchContent = function(
  query: string,
  entityTypes?: string[],
  userId?: mongoose.Types.ObjectId,
  limit: number = 50
): Promise<ISearchIndex[]> {
  const searchQuery: any = {
    $text: { $search: query }
  };
  
  if (entityTypes && entityTypes.length > 0) {
    searchQuery.entityType = { $in: entityTypes };
  }
  
  if (userId) {
    searchQuery.$or = [
      { 'permissions.viewableBy': userId },
      { 'permissions.roles': { $exists: true } } // Could be refined based on user role
    ];
  }
  
  return this.find(searchQuery, {
    score: { $meta: 'textScore' }
  })
    .populate('entityId')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

// Static method to index an entity
SearchIndexSchema.statics.indexEntity = function(
  entityType: string,
  entityId: mongoose.Types.ObjectId,
  content: string,
  tags?: string[],
  metadata?: Record<string, any>
): Promise<ISearchIndex> {
  return this.findOneAndUpdate(
    { entityType, entityId } as any,
    {
      content,
      tags: tags || [],
      metadata: metadata || {},
      lastIndexed: new Date()
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

// Static method to remove entity from index
SearchIndexSchema.statics.removeEntityFromIndex = function(
  entityId: mongoose.Types.ObjectId
): Promise<void> {
  return this.deleteMany({ entityId });
};

// Static method to update entity index
SearchIndexSchema.statics.updateEntityIndex = function(
  entityId: mongoose.Types.ObjectId,
  content: string,
  tags?: string[],
  metadata?: Record<string, any>
): Promise<ISearchIndex | null> {
  return this.findOneAndUpdate(
    { entityId },
    {
      content,
      tags: tags || [],
      metadata: metadata || {},
      lastIndexed: new Date()
    },
    { new: true }
  );
};

// ActivityLog static methods

// Static method to log activity
ActivityLogSchema.statics.logActivity = function(
  userId: mongoose.Types.ObjectId,
  action: string,
  entityType: string,
  entityId: mongoose.Types.ObjectId,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<IActivityLog> {
  return this.create({
    userId,
    action,
    entityType,
    entityId,
    metadata: metadata || {},
    ipAddress: ipAddress || '0.0.0.0',
    userAgent: userAgent || 'Unknown',
    timestamp: new Date(),
    success: true
  });
};

// Static method to get user activity
ActivityLogSchema.statics.getUserActivity = function(
  userId: mongoose.Types.ObjectId,
  limit: number = 100,
  offset: number = 0
): Promise<IActivityLog[]> {
  return this.find({ userId })
    .populate('entityId')
    .sort({ timestamp: -1 })
    .skip(offset)
    .limit(limit);
};

// Static method to get entity activity
ActivityLogSchema.statics.getEntityActivity = function(
  entityType: string,
  entityId: mongoose.Types.ObjectId
): Promise<IActivityLog[]> {
  return this.find({ entityType, entityId })
    .populate('userId', 'name email')
    .sort({ timestamp: -1 });
};

// Static method to get security logs
ActivityLogSchema.statics.getSecurityLogs = function(
  startDate?: Date,
  endDate?: Date
): Promise<IActivityLog[]> {
  const query: any = {
    action: {
      $in: ['login', 'logout', 'failed-login', 'password-change', 'account-lock']
    }
  };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query)
    .populate('userId', 'name email')
    .sort({ timestamp: -1 });
};

// Pre-save middleware for SearchIndex
SearchIndexSchema.pre('save', function() {
  // Ensure content is not empty
  if (!this.content || this.content.trim().length === 0) {
    throw new Error('Content cannot be empty');
  }
  
  // Clean up tags
  if (this.tags) {
    this.tags = this.tags.filter(tag => tag && tag.trim().length > 0);
  }
});

// Pre-save middleware for ActivityLog
ActivityLogSchema.pre('save', function() {
  // Validate IP address format (basic check)
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^::1$|^localhost$/;
  if (!ipRegex.test(this.ipAddress)) {
    // Allow common local development values
    if (!['::1', 'localhost', '127.0.0.1'].includes(this.ipAddress)) {
      this.ipAddress = '0.0.0.0'; // Default for invalid IPs
    }
  }
  
  // Ensure timestamp is set
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
});

// Create and export the models
const SearchIndex = (mongoose.models.SearchIndex as ISearchIndexModel) || 
  mongoose.model<ISearchIndex, ISearchIndexModel>('SearchIndex', SearchIndexSchema);

const ActivityLog = (mongoose.models.ActivityLog as IActivityLogModel) || 
  mongoose.model<IActivityLog, IActivityLogModel>('ActivityLog', ActivityLogSchema);

export { SearchIndex, ActivityLog };
export default SearchIndex;