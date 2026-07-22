import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for FamilyMember subdocument
export interface IFamilyMember {
  _id?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  relationship: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  role: 'caregiver' | 'emergency-contact' | 'family' | 'support';
  permissions: string[];
  isActive: boolean;
  invitedAt?: Date;
  joinedAt?: Date;
}

// Interface for FamilyTreeNode subdocument
export interface IFamilyTreeNode {
  memberId: string;
  name: string;
  relationship: string;
  generation: number;
  parentIds: string[];
  avatar?: string;
  isDeceased: boolean;
  birthYear?: number;
  notes?: string;
}

// Interface for Family document
export interface IFamily extends Document {
  familyName: string;
  primaryParents: mongoose.Types.ObjectId[];
  children: mongoose.Types.ObjectId[];
  extendedMembers: IFamilyMember[];
  familyTree: IFamilyTreeNode[];
  settings: {
    visibility: 'private' | 'therapist-visible' | 'public';
    allowMemberInvites: boolean;
    requireApproval: boolean;
    sharePhotos: boolean;
    shareDocuments: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  addMember(member: IFamilyMember): void;
  removeMember(memberId: string): void;
  updateMemberPermissions(memberId: string, permissions: string[]): void;
  canUserAccess(userId: mongoose.Types.ObjectId): boolean;
}

// Interface for Family model with static methods
export interface IFamilyModel extends Model<IFamily> {
  findByPrimaryParent(parentId: mongoose.Types.ObjectId): Promise<IFamily[]>;
  findByMember(userId: mongoose.Types.ObjectId): Promise<IFamily[]>;
  findByChild(childId: mongoose.Types.ObjectId): Promise<IFamily | null>;
}

// FamilyMember schema
const FamilyMemberSchema = new Schema<IFamilyMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true,
    maxlength: [50, 'Relationship cannot exceed 50 characters']
  },
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(email: string) {
          if (!email) return true; // Allow empty email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address'
      }
    },
    phone: {
      type: String,
      trim: true
    }
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['caregiver', 'emergency-contact', 'family', 'support'],
      message: 'Role must be caregiver, emergency-contact, family, or support'
    }
  },
  permissions: [{
    type: String,
    trim: true,
    enum: {
      values: [
        'view-profile',
        'edit-profile',
        'view-media',
        'upload-media',
        'view-documents',
        'upload-documents',
        'view-messages',
        'send-messages',
        'manage-family'
      ],
      message: 'Invalid permission'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  invitedAt: {
    type: Date
  },
  joinedAt: {
    type: Date
  }
}, { _id: true });

// FamilyTreeNode schema
const FamilyTreeNodeSchema = new Schema<IFamilyTreeNode>({
  memberId: {
    type: String,
    required: [true, 'Member ID is required']
  },
  name: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true,
    maxlength: [50, 'Relationship cannot exceed 50 characters']
  },
  generation: {
    type: Number,
    required: [true, 'Generation is required'],
    min: [0, 'Generation cannot be negative']
  },
  parentIds: [{
    type: String
  }],
  avatar: {
    type: String,
    trim: true
  },
  isDeceased: {
    type: Boolean,
    default: false
  },
  birthYear: {
    type: Number,
    min: [1800, 'Birth year must be after 1800'],
    max: [new Date().getFullYear(), 'Birth year cannot be in the future']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, { _id: false });

// Family schema definition
const FamilySchema = new Schema<IFamily>({
  familyName: {
    type: String,
    required: [true, 'Family name is required'],
    trim: true,
    maxlength: [100, 'Family name cannot exceed 100 characters']
  },
  primaryParents: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'Child'
  }],
  extendedMembers: [FamilyMemberSchema],
  familyTree: [FamilyTreeNodeSchema],
  settings: {
    visibility: {
      type: String,
      enum: {
        values: ['private', 'therapist-visible', 'public'],
        message: 'Visibility must be private, therapist-visible, or public'
      },
      default: 'private'
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    sharePhotos: {
      type: Boolean,
      default: false
    },
    shareDocuments: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  collection: 'families'
});

// Indexes for performance
FamilySchema.index({ primaryParents: 1 });
FamilySchema.index({ children: 1 });
FamilySchema.index({ 'extendedMembers.userId': 1 });
FamilySchema.index({ 'settings.visibility': 1 });
FamilySchema.index({ createdAt: -1 });

// Instance method to add member
FamilySchema.methods.addMember = function(member: IFamilyMember): void {
  if (!member.permissions || member.permissions.length === 0) {
    // Set default permissions based on role
    switch (member.role) {
      case 'caregiver':
        member.permissions = ['view-profile', 'edit-profile', 'view-media', 'upload-media', 'view-messages', 'send-messages'];
        break;
      case 'emergency-contact':
        member.permissions = ['view-profile', 'view-messages'];
        break;
      case 'family':
        member.permissions = ['view-profile', 'view-media'];
        break;
      case 'support':
        member.permissions = ['view-profile', 'view-documents', 'view-messages', 'send-messages'];
        break;
    }
  }
  
  member.invitedAt = new Date();
  this.extendedMembers.push(member);
};

// Instance method to remove member
FamilySchema.methods.removeMember = function(memberId: string): void {
  this.extendedMembers = this.extendedMembers.filter(
    (member: any) => member._id?.toString() !== memberId
  );
};

// Instance method to update member permissions
FamilySchema.methods.updateMemberPermissions = function(
  memberId: string,
  permissions: string[]
): void {
  const member = this.extendedMembers.find(
    (member: any) => member._id?.toString() === memberId
  );
  if (member) {
    member.permissions = permissions;
  }
};

// Instance method to check user access
FamilySchema.methods.canUserAccess = function(userId: mongoose.Types.ObjectId): boolean {
  // Check if user is primary parent
  if (this.primaryParents.some((parentId: any) => parentId.toString() === userId.toString())) {
    return true;
  }

  // Check if user is in extended members and active
  const member = this.extendedMembers.find(
    (member: any) => member.userId?.toString() === userId.toString() && member.isActive
  );
  
  return !!member;
};

// Static method to find families by primary parent
FamilySchema.statics.findByPrimaryParent = function(
  parentId: mongoose.Types.ObjectId
): Promise<IFamily[]> {
  return this.find({ primaryParents: parentId })
    .populate('primaryParents', 'name email')
    .populate('children', 'name dateOfBirth')
    .populate('extendedMembers.userId', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to find families by member
FamilySchema.statics.findByMember = function(
  userId: mongoose.Types.ObjectId
): Promise<IFamily[]> {
  return this.find({
    $or: [
      { primaryParents: userId },
      { 'extendedMembers.userId': userId, 'extendedMembers.isActive': true }
    ]
  })
    .populate('primaryParents', 'name email')
    .populate('children', 'name dateOfBirth')
    .sort({ createdAt: -1 });
};

// Static method to find family by child
FamilySchema.statics.findByChild = function(
  childId: mongoose.Types.ObjectId
): Promise<IFamily | null> {
  return this.findOne({ children: childId })
    .populate('primaryParents', 'name email')
    .populate('children', 'name dateOfBirth')
    .populate('extendedMembers.userId', 'name email');
};

// Pre-save middleware for validation
FamilySchema.pre('save', function() {
  // Ensure at least one primary parent
  if (!this.primaryParents || this.primaryParents.length === 0) {
    throw new Error('At least one primary parent is required');
  }
  
  // Validate family tree consistency
  if (this.familyTree && this.familyTree.length > 0) {
    const memberIds = this.familyTree.map(node => node.memberId);
    const uniqueIds = new Set(memberIds);
    if (memberIds.length !== uniqueIds.size) {
      throw new Error('Family tree cannot contain duplicate members');
    }
  }
});

// Create and export the Family model
const Family = (mongoose.models.Family as IFamilyModel) || 
  mongoose.model<IFamily, IFamilyModel>('Family', FamilySchema);

export default Family;