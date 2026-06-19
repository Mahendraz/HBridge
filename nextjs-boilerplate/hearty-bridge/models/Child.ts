import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Child document
export interface IChild extends Document {
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  parentId: mongoose.Types.ObjectId;
  therapistId?: mongoose.Types.ObjectId;
  medicalInfo?: {
    conditions?: string[];
    medications?: string[];
    allergies?: string[];
    notes?: string;
  };
  contactInfo?: {
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  getAge(): number;
  toSafeObject(): any;
}

// Interface for Child model with static methods
export interface IChildModel extends Model<IChild> {
  findByParent(parentId: mongoose.Types.ObjectId): Promise<IChild[]>;
  findByTherapist(therapistId: mongoose.Types.ObjectId): Promise<IChild[]>;
  findActiveChildren(): Promise<IChild[]>;
}

// Child schema definition
const ChildSchema = new Schema<IChild>({
  name: {
    type: String,
    required: [true, 'Child name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(dateOfBirth: Date) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        return birthDate <= today && birthDate >= new Date('1900-01-01');
      },
      message: 'Please provide a valid date of birth'
    }
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female'],
      message: 'Gender must be either male or female'
    }
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent ID is required']
  },
  therapistId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  medicalInfo: {
    conditions: [{
      type: String,
      trim: true,
      maxlength: [200, 'Medical condition description cannot exceed 200 characters']
    }],
    medications: [{
      type: String,
      trim: true,
      maxlength: [200, 'Medication description cannot exceed 200 characters']
    }],
    allergies: [{
      type: String,
      trim: true,
      maxlength: [200, 'Allergy description cannot exceed 200 characters']
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Medical notes cannot exceed 2000 characters']
    }
  },
  contactInfo: {
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
      },
      phone: {
        type: String,
        trim: true
      },
      relationship: {
        type: String,
        trim: true,
        maxlength: [50, 'Relationship cannot exceed 50 characters']
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'children'
});

// Indexes for performance and data relationships
ChildSchema.index({ parentId: 1 });
ChildSchema.index({ therapistId: 1 });
ChildSchema.index({ isActive: 1 });
ChildSchema.index({ createdAt: -1 });

// Virtual property for age calculation
ChildSchema.virtual('age').get(function(this: IChild) {
  return this.getAge();
});

// Ensure virtual fields are included when converting to JSON
ChildSchema.set('toJSON', { virtuals: true });
ChildSchema.set('toObject', { virtuals: true });

// Instance method to calculate age
ChildSchema.methods.getAge = function(): number {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
};

// Instance method to return safe child object
ChildSchema.methods.toSafeObject = function() {
  return this.toObject();
};

// Static method to find children by parent
ChildSchema.statics.findByParent = function(parentId: mongoose.Types.ObjectId): Promise<IChild[]> {
  return this.find({ parentId, isActive: true })
    .populate('therapistId', 'name email profile.specialization profile.clinic')
    .sort({ createdAt: -1 });
};

// Static method to find children by therapist
ChildSchema.statics.findByTherapist = function(therapistId: mongoose.Types.ObjectId): Promise<IChild[]> {
  return this.find({ therapistId, isActive: true })
    .populate('parentId', 'name email phone')
    .sort({ createdAt: -1 });
};

// Static method to find all active children
ChildSchema.statics.findActiveChildren = function(): Promise<IChild[]> {
  return this.find({ isActive: true })
    .populate('parentId', 'name email')
    .populate('therapistId', 'name email profile.specialization')
    .sort({ createdAt: -1 });
};

// Create and export the Child model
const Child = (mongoose.models.Child as IChildModel) || mongoose.model<IChild, IChildModel>('Child', ChildSchema);

export default Child;