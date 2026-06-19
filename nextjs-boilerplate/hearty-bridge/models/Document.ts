import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for Document document
export interface IDocument extends Document {
  title: string;
  type: 'medical' | 'educational' | 'legal' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  childId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  expiryDate?: Date;
  tags: string[];
  description?: string;
  isConfidential: boolean;
  accessLevel: 'parent-only' | 'therapist-only' | 'shared';
  version: number;
  parentDocument?: mongoose.Types.ObjectId;
  metadata?: {
    checksum?: string;
    encryptionStatus?: 'encrypted' | 'plain';
    ocrText?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isExpiring(): boolean;
  getDaysUntilExpiry(): number | null;
}

// Interface for Document model with static methods
export interface IDocumentModel extends Model<IDocument> {
  findByChild(childId: mongoose.Types.ObjectId, type?: string): Promise<IDocument[]>;
  findByUploader(uploaderId: mongoose.Types.ObjectId): Promise<IDocument[]>;
  findExpiringDocuments(days?: number): Promise<IDocument[]>;
  findByAccessLevel(
    accessLevel: 'parent-only' | 'therapist-only' | 'shared',
    userId: mongoose.Types.ObjectId
  ): Promise<IDocument[]>;
}

// Document schema definition
const DocumentSchema = new Schema<IDocument>({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: {
      values: ['medical', 'educational', 'legal', 'other'],
      message: 'Type must be medical, educational, legal, or other'
    },
    index: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true
  },
  childId: {
    type: Schema.Types.ObjectId,
    ref: 'Child',
    index: true
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader ID is required'],
    index: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiryDate: {
    type: Date,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  isConfidential: {
    type: Boolean,
    default: false,
    index: true
  },
  accessLevel: {
    type: String,
    required: [true, 'Access level is required'],
    enum: {
      values: ['parent-only', 'therapist-only', 'shared'],
      message: 'Access level must be parent-only, therapist-only, or shared'
    },
    index: true
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  parentDocument: {
    type: Schema.Types.ObjectId,
    ref: 'Document'
  },
  metadata: {
    checksum: {
      type: String,
      trim: true
    },
    encryptionStatus: {
      type: String,
      enum: ['encrypted', 'plain'],
      default: 'plain'
    },
    ocrText: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  collection: 'documents'
});

// Indexes for performance and queries
DocumentSchema.index({ childId: 1, type: 1 });
DocumentSchema.index({ uploadedBy: 1, uploadedAt: -1 });
DocumentSchema.index({ expiryDate: 1 });
DocumentSchema.index({ tags: 1 });
DocumentSchema.index({ accessLevel: 1, childId: 1 });
DocumentSchema.index({ createdAt: -1 });

// Text index for searching
DocumentSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'metadata.ocrText': 'text'
});

// Instance method to check if document is expiring
DocumentSchema.methods.isExpiring = function(): boolean {
  if (!this.expiryDate) return false;
  const daysUntilExpiry = this.getDaysUntilExpiry();
  return daysUntilExpiry !== null && daysUntilExpiry <= 30;
};

// Instance method to get days until expiry
DocumentSchema.methods.getDaysUntilExpiry = function(): number | null {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Static method to find documents by child
DocumentSchema.statics.findByChild = function(
  childId: mongoose.Types.ObjectId,
  type?: string
): Promise<IDocument[]> {
  const query: any = { childId };
  if (type) {
    query.type = type;
  }
  return this.find(query)
    .populate('uploadedBy', 'name email')
    .sort({ uploadedAt: -1 });
};

// Static method to find documents by uploader
DocumentSchema.statics.findByUploader = function(
  uploaderId: mongoose.Types.ObjectId
): Promise<IDocument[]> {
  return this.find({ uploadedBy: uploaderId })
    .populate('childId', 'name')
    .sort({ uploadedAt: -1 });
};

// Static method to find expiring documents
DocumentSchema.statics.findExpiringDocuments = function(
  days: number = 30
): Promise<IDocument[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: {
      $lte: futureDate,
      $gte: new Date()
    }
  })
    .populate('uploadedBy', 'name email')
    .populate('childId', 'name')
    .sort({ expiryDate: 1 });
};

// Static method to find documents by access level
DocumentSchema.statics.findByAccessLevel = function(
  accessLevel: 'parent-only' | 'therapist-only' | 'shared',
  userId: mongoose.Types.ObjectId
): Promise<IDocument[]> {
  return this.find({ accessLevel })
    .populate('uploadedBy', 'name email')
    .populate('childId', 'name')
    .sort({ uploadedAt: -1 });
};

// Pre-save middleware for validation
DocumentSchema.pre('save', function() {
  // Validate file size (max 50MB for documents)
  if (this.fileSize > 50 * 1024 * 1024) {
    throw new Error('Document size cannot exceed 50MB');
  }

  // Validate MIME types for documents
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];

  if (!allowedTypes.includes(this.mimeType)) {
    throw new Error('Invalid document type');
  }

  // Validate expiry date
  if (this.expiryDate && this.expiryDate <= new Date()) {
    throw new Error('Expiry date must be in the future');
  }
});

// Create and export the Document model
const DocumentModel = (mongoose.models.Document as IDocumentModel) || 
  mongoose.model<IDocument, IDocumentModel>('Document', DocumentSchema);

export default DocumentModel;