import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for MediaFile document
export interface IMediaFile extends Document {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail?: string;
  childId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  tags: string[];
  description?: string;
  isPublic: boolean;
  type: 'photo' | 'video' | 'audio';
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Interface for MediaFile model with static methods
export interface IMediaFileModel extends Model<IMediaFile> {
  findByChild(childId: mongoose.Types.ObjectId, type?: string): Promise<IMediaFile[]>;
  findByUploader(uploaderId: mongoose.Types.ObjectId): Promise<IMediaFile[]>;
  findPublicMedia(): Promise<IMediaFile[]>;
}

// MediaFile schema definition
const MediaFileSchema = new Schema<IMediaFile>({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  url: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  thumbnail: {
    type: String,
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
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  type: {
    type: String,
    required: [true, 'Media type is required'],
    enum: {
      values: ['photo', 'video', 'audio'],
      message: 'Type must be photo, video, or audio'
    },
    index: true
  },
  metadata: {
    width: {
      type: Number,
      min: [0, 'Width cannot be negative']
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative']
    },
    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative']
    },
    location: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  }
}, {
  timestamps: true,
  collection: 'mediafiles'
});

// Indexes for performance
MediaFileSchema.index({ childId: 1, type: 1 });
MediaFileSchema.index({ uploadedBy: 1, uploadedAt: -1 });
MediaFileSchema.index({ tags: 1 });
MediaFileSchema.index({ mimeType: 1 });
MediaFileSchema.index({ createdAt: -1 });

// Text index for searching
MediaFileSchema.index({
  originalName: 'text',
  description: 'text',
  tags: 'text'
});

// Static method to find media files by child
MediaFileSchema.statics.findByChild = function(
  childId: mongoose.Types.ObjectId,
  type?: string
): Promise<IMediaFile[]> {
  const query: any = { childId };
  if (type) {
    query.type = type;
  }
  return this.find(query)
    .populate('uploadedBy', 'name email')
    .sort({ uploadedAt: -1 });
};

// Static method to find media files by uploader
MediaFileSchema.statics.findByUploader = function(
  uploaderId: mongoose.Types.ObjectId
): Promise<IMediaFile[]> {
  return this.find({ uploadedBy: uploaderId })
    .populate('childId', 'name')
    .sort({ uploadedAt: -1 });
};

// Static method to find public media files
MediaFileSchema.statics.findPublicMedia = function(): Promise<IMediaFile[]> {
  return this.find({ isPublic: true })
    .populate('uploadedBy', 'name')
    .populate('childId', 'name')
    .sort({ uploadedAt: -1 });
};

// Pre-save middleware for validation
MediaFileSchema.pre('save', function() {
  // Validate file size (max 100MB)
  if (this.size > 100 * 1024 * 1024) {
    throw new Error('File size cannot exceed 100MB');
  }

  // Validate media type against MIME type
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
  const audioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];

  if (this.type === 'photo' && !imageTypes.includes(this.mimeType)) {
    throw new Error('Invalid MIME type for photo');
  }
  if (this.type === 'video' && !videoTypes.includes(this.mimeType)) {
    throw new Error('Invalid MIME type for video');
  }
  if (this.type === 'audio' && !audioTypes.includes(this.mimeType)) {
    throw new Error('Invalid MIME type for audio');
  }
});

// Create and export the MediaFile model
const MediaFile = (mongoose.models.MediaFile as IMediaFileModel) || 
  mongoose.model<IMediaFile, IMediaFileModel>('MediaFile', MediaFileSchema);

export default MediaFile;