import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReportComment extends Document {
  reportId:       mongoose.Types.ObjectId;
  childId:        mongoose.Types.ObjectId;
  therapistId:    mongoose.Types.ObjectId;
  authorId:       mongoose.Types.ObjectId;
  authorName:     string;
  authorRole:     'parent' | 'therapist' | 'admin';
  text:           string;
  parentCommentId?: mongoose.Types.ObjectId | null;
  isResolved:     boolean;
  resolvedAt?:    Date | null;
  resolvedById?:  mongoose.Types.ObjectId | null;
  resolvedByName?: string;
  isActive:       boolean;
  createdAt:      Date;
  updatedAt:      Date;
}

export interface IReportCommentModel extends Model<IReportComment> {}

const ReportCommentSchema = new Schema<IReportComment>(
  {
    reportId:    { type: Schema.Types.ObjectId, ref: 'Report',       required: true, index: true },
    childId:     { type: Schema.Types.ObjectId, ref: 'Child',        required: true },
    therapistId: { type: Schema.Types.ObjectId, ref: 'User',         required: true },
    authorId:    { type: Schema.Types.ObjectId, ref: 'User',         required: true },
    authorName:  { type: String, required: true, trim: true },
    authorRole:  { type: String, enum: ['parent', 'therapist', 'admin'], required: true },
    text:        { type: String, required: true, trim: true, maxlength: 1000 },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'ReportComment', default: null, index: true },
    isResolved:  { type: Boolean, default: false },
    resolvedAt:  { type: Date, default: null },
    resolvedById:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedByName:  { type: String, default: '' },
    isActive:    { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'report_comments',
  }
);

ReportCommentSchema.index({ therapistId: 1, isResolved: 1, isActive: 1 });
ReportCommentSchema.index({ reportId: 1, isActive: 1, createdAt: 1 });

const ReportComment =
  (mongoose.models.ReportComment as IReportCommentModel) ||
  mongoose.model<IReportComment, IReportCommentModel>('ReportComment', ReportCommentSchema);

export default ReportComment;
