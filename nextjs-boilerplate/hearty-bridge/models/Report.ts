import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportMediaFile {
  fileName: string;
  fileType: 'image' | 'video' | 'document';
  gcsPath: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IReport extends Document {
  title: string;
  description: string;
  content: string;
  type: 'progress' | 'assessment' | 'therapy-notes' | 'milestone';
  status: 'draft' | 'completed';
  childId: mongoose.Types.ObjectId;
  childName: string;
  therapistId: mongoose.Types.ObjectId;
  therapistName: string;
  mediaFiles: IReportMediaFile[];
  dueDate?: Date;
  sessionDate?: Date;
  sessionHour?: number;
  tags: string[];
  fileUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportModel extends Model<IReport> {}

const ReportMediaFileSchema = new Schema<IReportMediaFile>(
  {
    fileName:   { type: String, required: true, trim: true },
    fileType:   { type: String, enum: ['image', 'video', 'document'], required: true },
    gcsPath:    { type: String, required: true },
    url:        { type: String, required: true },
    mimeType:   { type: String, required: true },
    size:       { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReport>(
  {
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, default: '', trim: true },
    content: { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: {
        values: ['progress', 'assessment', 'therapy-notes', 'milestone'],
        message: 'Invalid report type',
      },
      default: 'progress',
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'completed'],
        message: 'Invalid report status',
      },
      default: 'draft',
    },
    childId:       { type: Schema.Types.ObjectId, ref: 'Child', required: [true, 'Child ID is required'] },
    childName:     { type: String, default: '', trim: true },
    therapistId:   { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Therapist ID is required'] },
    therapistName: { type: String, default: '', trim: true },
    mediaFiles:    { type: [ReportMediaFileSchema], default: [] },
    dueDate:       { type: Date },
    sessionDate:   { type: Date, default: null, index: true },
    sessionHour:   { type: Number, default: null },
    tags:          [{ type: String, trim: true }],
    fileUrl:       { type: String },
    isActive:      { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'reports',
  }
);

ReportSchema.index({ therapistId: 1 });
ReportSchema.index({ childId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ isActive: 1 });

const Report = (mongoose.models.Report as IReportModel) ||
  mongoose.model<IReport, IReportModel>('Report', ReportSchema);

export default Report;
