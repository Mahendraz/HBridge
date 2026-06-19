import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Milestone document
export interface IMilestone extends Document {
  title: string;
  description: string;
  childId: mongoose.Types.ObjectId;
  achievedDate?: Date;
  targetDate?: Date;
  category: 'physical' | 'cognitive' | 'social' | 'emotional' | 'communication';
  status: 'not-started' | 'in-progress' | 'achieved' | 'deferred';
  notes: string;
  attachments: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  priority: 'low' | 'medium' | 'high';
  ageGroup: string;
  skills: string[];
  progressUpdates: {
    date: Date;
    note: string;
    updatedBy: mongoose.Types.ObjectId;
    attachments?: mongoose.Types.ObjectId[];
  }[];
  createdAt: Date;
  updatedAt: Date;
  isOverdue(): boolean;
  getDaysToTarget(): number | null;
  getProgressPercentage(): number;
  addProgressUpdate(note: string, updatedBy: mongoose.Types.ObjectId, attachments?: mongoose.Types.ObjectId[]): void;
}

// Interface for Milestone model with static methods
export interface IMilestoneModel extends Model<IMilestone> {
  findByChild(childId: mongoose.Types.ObjectId, status?: string): Promise<IMilestone[]>;
  findByCategory(category: string, childId?: mongoose.Types.ObjectId): Promise<IMilestone[]>;
  findOverdueMilestones(): Promise<IMilestone[]>;
  findUpcomingMilestones(days?: number): Promise<IMilestone[]>;
  getMilestoneStatistics(childId?: mongoose.Types.ObjectId): Promise<any>;
}

// Milestone schema definition
const MilestoneSchema = new Schema<IMilestone>({
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Milestone description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: [true, 'Child ID is required'],
    index: true
  },
  achievedDate: {
    type: Date,
    index: true
  },
  targetDate: {
    type: Date,
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['physical', 'cognitive', 'social', 'emotional', 'communication'],
      message: 'Category must be physical, cognitive, social, emotional, or communication'
    },
    index: true
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['not-started', 'in-progress', 'achieved', 'deferred'],
      message: 'Status must be not-started, in-progress, achieved, or deferred'
    },
    default: 'not-started',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    default: ''
  },
  attachments: [{
    type: Schema.Types.ObjectId,
    ref: 'MediaFile'
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high'
    },
    default: 'medium',
    index: true
  },
  ageGroup: {
    type: String,
    trim: true,
    maxlength: [50, 'Age group cannot exceed 50 characters']
  },
  skills: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill cannot exceed 100 characters']
  }],
  progressUpdates: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Progress note cannot exceed 1000 characters']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    attachments: [{
      type: Schema.Types.ObjectId,
      ref: 'MediaFile'
    }]
  }]
}, {
  timestamps: true,
  collection: 'milestones'
});

// Indexes for performance
MilestoneSchema.index({ childId: 1, status: 1 });
MilestoneSchema.index({ childId: 1, category: 1 });
MilestoneSchema.index({ targetDate: 1, status: 1 });
MilestoneSchema.index({ createdBy: 1 });
MilestoneSchema.index({ priority: 1, status: 1 });
MilestoneSchema.index({ createdAt: -1 });

// Text index for search
MilestoneSchema.index({
  title: 'text',
  description: 'text',
  notes: 'text',
  skills: 'text'
});

// Instance method to check if milestone is overdue
MilestoneSchema.methods.isOverdue = function(): boolean {
  if (!this.targetDate || this.status === 'achieved') return false;
  return new Date() > this.targetDate;
};

// Instance method to get days until target date
MilestoneSchema.methods.getDaysToTarget = function(): number | null {
  if (!this.targetDate) return null;
  const today = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Instance method to get progress percentage
MilestoneSchema.methods.getProgressPercentage = function(): number {
  switch (this.status) {
    case 'not-started':
      return 0;
    case 'in-progress':
      // Base progress on number of updates and time elapsed
      const baseProgress = Math.min(this.progressUpdates.length * 20, 80);
      return baseProgress;
    case 'achieved':
      return 100;
    case 'deferred':
      return 0;
    default:
      return 0;
  }
};

// Instance method to add progress update
MilestoneSchema.methods.addProgressUpdate = function(
  note: string,
  updatedBy: mongoose.Types.ObjectId,
  attachments?: mongoose.Types.ObjectId[]
): void {
  this.progressUpdates.push({
    date: new Date(),
    note,
    updatedBy,
    attachments: attachments || []
  });
  
  this.updatedBy = updatedBy;
  
  // Auto-update status if not already achieved
  if (this.status === 'not-started') {
    this.status = 'in-progress';
  }
};

// Static method to find milestones by child
MilestoneSchema.statics.findByChild = function(
  childId: mongoose.Types.ObjectId,
  status?: string
): Promise<IMilestone[]> {
  const query: any = { childId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('attachments')
    .populate('progressUpdates.updatedBy', 'name')
    .sort({ priority: -1, targetDate: 1, createdAt: -1 });
};

// Static method to find milestones by category
MilestoneSchema.statics.findByCategory = function(
  category: string,
  childId?: mongoose.Types.ObjectId
): Promise<IMilestone[]> {
  const query: any = { category };
  if (childId) {
    query.childId = childId;
  }
  
  return this.find(query)
    .populate('childId', 'name dateOfBirth')
    .populate('createdBy', 'name email')
    .sort({ priority: -1, targetDate: 1 });
};

// Static method to find overdue milestones
MilestoneSchema.statics.findOverdueMilestones = function(): Promise<IMilestone[]> {
  return this.find({
    targetDate: { $lt: new Date() },
    status: { $nin: ['achieved', 'deferred'] }
  })
    .populate('childId', 'name parentId')
    .populate('createdBy', 'name email')
    .sort({ targetDate: 1 });
};

// Static method to find upcoming milestones
MilestoneSchema.statics.findUpcomingMilestones = function(
  days: number = 30
): Promise<IMilestone[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    targetDate: {
      $gte: new Date(),
      $lte: futureDate
    },
    status: { $nin: ['achieved', 'deferred'] }
  })
    .populate('childId', 'name parentId')
    .populate('createdBy', 'name email')
    .sort({ targetDate: 1 });
};

// Static method to get milestone statistics
MilestoneSchema.statics.getMilestoneStatistics = function(
  childId?: mongoose.Types.ObjectId
): Promise<any> {
  const matchStage: any = {};
  if (childId) {
    matchStage.childId = new mongoose.Types.ObjectId(childId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalMilestones: { $sum: 1 },
        achievedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'achieved'] }, 1, 0] }
        },
        inProgressCount: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
        },
        notStartedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'not-started'] }, 1, 0] }
        },
        deferredCount: {
          $sum: { $cond: [{ $eq: ['$status', 'deferred'] }, 1, 0] }
        },
        overdueCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lt: ['$targetDate', new Date()] },
                  { $nin: ['$status', ['achieved', 'deferred']] }
                ]
              },
              1,
              0
            ]
          }
        },
        categoryBreakdown: {
          $push: {
            category: '$category',
            status: '$status'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalMilestones: 1,
        achievedCount: 1,
        inProgressCount: 1,
        notStartedCount: 1,
        deferredCount: 1,
        overdueCount: 1,
        achievementRate: {
          $cond: [
            { $gt: ['$totalMilestones', 0] },
            { $multiply: [{ $divide: ['$achievedCount', '$totalMilestones'] }, 100] },
            0
          ]
        },
        categoryBreakdown: 1
      }
    }
  ]);
};

// Pre-save middleware for validation
MilestoneSchema.pre('save', function() {
  // Validate achieved date
  if (this.status === 'achieved' && !this.achievedDate) {
    this.achievedDate = new Date();
  }
  
  if (this.achievedDate && this.status !== 'achieved') {
    this.status = 'achieved';
  }
  
  // Validate target date
  if (this.targetDate && this.targetDate <= new Date()) {
    const today = new Date();
    if (this.targetDate < today && this.status === 'not-started') {
      // Don't auto-change to overdue, but could be handled by business logic
    }
  }
  
  // Ensure progress updates are sorted by date
  if (this.progressUpdates && this.progressUpdates.length > 1) {
    this.progressUpdates.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
});

// Create and export the Milestone model
const Milestone = (mongoose.models.Milestone as IMilestoneModel) || 
  mongoose.model<IMilestone, IMilestoneModel>('Milestone', MilestoneSchema);

export default Milestone;