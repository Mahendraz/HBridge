import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Progress document
export interface IProgress extends Document {
  childId: mongoose.Types.ObjectId;
  therapistId: mongoose.Types.ObjectId;
  overallProgress: number;
  weeklyProgress: Array<{
    week: string;
    score: number;
    sessions: number;
    date: Date;
  }>;
  skillAreas: Array<{
    area: string;
    currentLevel: number;
    targetLevel: number;
    progress: number;
  }>;
  milestones: Array<{
    title: string;
    description: string;
    achievedDate?: Date;
    targetDate: Date;
    status: 'completed' | 'in-progress' | 'upcoming';
  }>;
  recentNotes: Array<{
    date: Date;
    therapist: string;
    note: string;
    rating: number;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Progress model with static methods
export interface IProgressModel extends Model<IProgress> {
  findByChild(childId: mongoose.Types.ObjectId): Promise<IProgress | null>;
  findByTherapist(therapistId: mongoose.Types.ObjectId): Promise<IProgress[]>;
}

// Progress schema definition
const ProgressSchema = new Schema<IProgress>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: [true, 'Child ID is required'],
    index: true
  },
  therapistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Therapist ID is required']
  },
  overallProgress: {
    type: Number,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100%'],
    default: 0
  },
  weeklyProgress: [{
    week: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    sessions: {
      type: Number,
      min: 0,
      required: true
    },
    date: {
      type: Date,
      required: true
    }
  }],
  skillAreas: [{
    area: {
      type: String,
      required: [true, 'Skill area name is required'],
      trim: true
    },
    currentLevel: {
      type: Number,
      min: [0, 'Current level cannot be negative'],
      max: [100, 'Current level cannot exceed 100'],
      required: true
    },
    targetLevel: {
      type: Number,
      min: [0, 'Target level cannot be negative'],
      max: [100, 'Target level cannot exceed 100'],
      required: true
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be negative'],
      max: [100, 'Progress cannot exceed 100'],
      required: true
    }
  }],
  milestones: [{
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
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    achievedDate: {
      type: Date
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required']
    },
    status: {
      type: String,
      enum: {
        values: ['completed', 'in-progress', 'upcoming'],
        message: 'Status must be completed, in-progress, or upcoming'
      },
      default: 'upcoming'
    }
  }],
  recentNotes: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    therapist: {
      type: String,
      required: true,
      trim: true
    },
    note: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true,
      maxlength: [2000, 'Note cannot exceed 2000 characters']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      required: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'progress'
});

// Indexes for performance
ProgressSchema.index({ childId: 1, isActive: 1 });
ProgressSchema.index({ therapistId: 1, isActive: 1 });
ProgressSchema.index({ createdAt: -1 });

// Static method to find progress by child
ProgressSchema.statics.findByChild = function(childId: mongoose.Types.ObjectId): Promise<IProgress | null> {
  return this.findOne({ childId, isActive: true })
    .populate('therapistId', 'name email profile.specialization')
    .sort({ updatedAt: -1 });
};

// Static method to find progress by therapist
ProgressSchema.statics.findByTherapist = function(therapistId: mongoose.Types.ObjectId): Promise<IProgress[]> {
  return this.find({ therapistId, isActive: true })
    .populate('childId', 'name dateOfBirth parentId')
    .sort({ updatedAt: -1 });
};

// Pre-save middleware to calculate overall progress
ProgressSchema.pre('save', function() {
  if (this.skillAreas && this.skillAreas.length > 0) {
    const totalProgress = this.skillAreas.reduce((sum, skill) => sum + skill.progress, 0);
    this.overallProgress = Math.round(totalProgress / this.skillAreas.length);
  }
});

// Create and export the Progress model
const Progress = (mongoose.models.Progress as IProgressModel) || mongoose.model<IProgress, IProgressModel>('Progress', ProgressSchema);

export default Progress;