import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPackage extends Document {
  name: string;
  sessions: number;
  price: number;
  therapyType: 'OT' | 'TW' | 'both';
  description?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPackageModel extends Model<IPackage> {}

const PackageSchema = new Schema<IPackage>(
  {
    name: {
      type: String,
      required: [true, 'Package name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    sessions: {
      type: Number,
      required: [true, 'Number of sessions is required'],
      min: [1, 'Sessions must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    therapyType: {
      type: String,
      required: [true, 'Therapy type is required'],
      enum: { values: ['OT', 'TW', 'both'], message: 'therapyType must be OT, TW, or both' },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
    },
  },
  {
    timestamps: true,
    collection: 'packages',
  }
);

PackageSchema.index({ isActive: 1, therapyType: 1 });
PackageSchema.index({ createdAt: -1 });

const Package =
  (mongoose.models.Package as IPackageModel) ||
  mongoose.model<IPackage, IPackageModel>('Package', PackageSchema);

export default Package;
