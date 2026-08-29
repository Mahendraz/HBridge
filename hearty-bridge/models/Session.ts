import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Session document
export interface ISession extends Document {
  childId: mongoose.Types.ObjectId;
  therapistId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  duration: number;
  type: 'in-person' | 'video' | 'phone';
  status: 'completed' | 'scheduled' | 'cancelled' | 'no-show';
  rating?: number;
  notes?: string;
  goals?: string[];
  nextSteps?: string;
  location?: string;
  meetingUrl?: string;
  packageId?: mongoose.Types.ObjectId;
  sessionNumber?: number;
  totalSessions?: number;
  sessionCategory: 'regular' | 'extra';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Session model with static methods
export interface ISessionModel extends Model<ISession> {
  findByChild(childId: mongoose.Types.ObjectId): Promise<ISession[]>;
  findByTherapist(therapistId: mongoose.Types.ObjectId): Promise<ISession[]>;
  findUpcomingSessions(childId: mongoose.Types.ObjectId): Promise<ISession[]>;
  findCompletedSessions(childId: mongoose.Types.ObjectId): Promise<ISession[]>;
}

// Session schema definition
const SessionSchema = new Schema<ISession>({
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    required: [true, 'Child ID is required'],
    index: true
  },
  therapistId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Therapist ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Session date is required'],
    index: true
  },
  time: {
    type: String,
    required: [true, 'Session time is required'],
    trim: true
  },
  duration: {
    type: Number,
    min: [15, 'Session duration must be at least 15 minutes'],
    max: [240, 'Session duration cannot exceed 4 hours'],
    default: 60
  },
  type: {
    type: String,
    enum: {
      values: ['in-person', 'video', 'phone'],
      message: 'Session type must be in-person, video, or phone'
    },
    default: 'in-person'
  },
  status: {
    type: String,
    enum: {
      values: ['completed', 'scheduled', 'cancelled', 'no-show'],
      message: 'Status must be completed, scheduled, cancelled, or no-show'
    },
    default: 'scheduled'
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  goals: [{
    type: String,
    trim: true,
    maxlength: [200, 'Goal cannot exceed 200 characters']
  }],
  nextSteps: {
    type: String,
    trim: true,
    maxlength: [1000, 'Next steps cannot exceed 1000 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  meetingUrl: {
    type: String,
    trim: true
  },
  packageId: {
    type: Schema.Types.ObjectId,
    ref: 'TokenTransaction',
    default: null,
    index: true
  },
  sessionNumber: {
    type: Number,
    default: null,
    min: 1
  },
  totalSessions: {
    type: Number,
    default: null,
    min: 1
  },
  sessionCategory: {
    type: String,
    enum: { values: ['regular', 'extra'], message: 'sessionCategory must be regular or extra' },
    default: 'regular'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Indexes for performance
SessionSchema.index({ childId: 1, date: -1 });
SessionSchema.index({ therapistId: 1, date: -1 });
SessionSchema.index({ date: -1, status: 1 });
SessionSchema.index({ isActive: 1 });
SessionSchema.index({ packageId: 1, sessionNumber: 1 });

// Static method to find sessions by child
SessionSchema.statics.findByChild = function(childId: mongoose.Types.ObjectId): Promise<ISession[]> {
  return this.find({ childId, isActive: true })
    .populate('therapistId', 'name email profile.specialization')
    .sort({ date: -1 });
};

// Static method to find sessions by therapist
SessionSchema.statics.findByTherapist = function(therapistId: mongoose.Types.ObjectId): Promise<ISession[]> {
  return this.find({ therapistId, isActive: true })
    .populate('childId', 'name dateOfBirth parentId')
    .sort({ date: -1 });
};

// Static method to find upcoming sessions
SessionSchema.statics.findUpcomingSessions = function(childId: mongoose.Types.ObjectId): Promise<ISession[]> {
  return this.find({ 
    childId, 
    isActive: true, 
    status: 'scheduled',
    date: { $gte: new Date() }
  })
    .populate('therapistId', 'name email profile.specialization')
    .sort({ date: 1 });
};

// Static method to find completed sessions
SessionSchema.statics.findCompletedSessions = function(childId: mongoose.Types.ObjectId): Promise<ISession[]> {
  return this.find({ 
    childId, 
    isActive: true, 
    status: 'completed'
  })
    .populate('therapistId', 'name email profile.specialization')
    .sort({ date: -1 });
};

// Pre-save validation
SessionSchema.pre('save', function() {
  // If session is completed, it should have a rating
  if (this.status === 'completed' && !this.rating) {
    this.rating = 3; // Default to neutral rating
  }
  
  // Video sessions should have meeting URL
  if (this.type === 'video' && !this.meetingUrl) {
    this.meetingUrl = `https://meet.google.com/generated-room-${this._id}`;
  }
});

// Create and export the Session model
const Session = (mongoose.models.Session as ISessionModel) || mongoose.model<ISession, ISessionModel>('Session', SessionSchema);

export default Session;