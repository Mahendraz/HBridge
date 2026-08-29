import mongoose, { Schema, Document, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

// Interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'therapist' | 'parent' | 'super_admin';
  phone?: string;
  avatar?: string;
  profile?: {
    specialization?: string[];
    clinic?: string;
    experience?: number;
    address?: string;
    color?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  permissions?: string[];
  emailVerified?: boolean;
  lastLogin?: Date;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): any;
}

// Interface for User model with static methods
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findActiveUsers(role?: 'admin' | 'therapist' | 'parent' | 'super_admin'): Promise<IUser[]>;
}

// User schema definition
const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['admin', 'therapist', 'parent', 'super_admin'],
      message: 'Role must be admin, therapist, parent, or super_admin'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  profile: {
    specialization: [{
      type: String,
      trim: true,
      maxlength: [200, 'Specialization cannot exceed 200 characters']
    }],
    clinic: {
      type: String,
      trim: true,
      maxlength: [200, 'Clinic name cannot exceed 200 characters']
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years']
    },
    address: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true,
      maxlength: [7, 'Color must be a hex code like #14b8a6']
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    }
  },
  permissions: [{
    type: String,
    trim: true
  }],
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance and security
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to return safe user object (without password)
UserSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email
UserSchema.statics.findByEmail = function(email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase(), isActive: true });
};

// Static method to find active users by role
UserSchema.statics.findActiveUsers = function(role?: 'admin' | 'therapist' | 'parent' | 'super_admin'): Promise<IUser[]> {
  const query: any = { isActive: true };
  if (role) {
    query.role = role;
  }
  return this.find(query).select('-password');
};

// Create and export the User model
const User = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;