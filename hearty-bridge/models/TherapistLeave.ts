import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITherapistLeave extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: 'therapist' | 'admin';
  type: 'cuti' | 'inactive';
  startDate: Date;
  endDate: Date | null;
  reason: string;
  status: 'active' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITherapistLeaveModel extends Model<ITherapistLeave> {}

const TherapistLeaveSchema = new Schema<ITherapistLeave>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName:     { type: String, required: true, trim: true },
    userRole:     { type: String, enum: ['therapist', 'admin'], required: true },
    type:         { type: String, enum: ['cuti', 'inactive'], required: true },
    startDate:    { type: Date, required: true },
    endDate:      { type: Date, default: null },
    reason:       { type: String, default: '', trim: true },
    status:       { type: String, enum: ['active', 'cancelled'], default: 'active', index: true },
    createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName:{ type: String, required: true, trim: true },
  },
  { timestamps: true, collection: 'therapist_leaves' }
);

TherapistLeaveSchema.index({ userId: 1, startDate: 1 });
TherapistLeaveSchema.index({ startDate: 1, endDate: 1, status: 1 });

const TherapistLeave =
  (mongoose.models.TherapistLeave as ITherapistLeaveModel) ||
  mongoose.model<ITherapistLeave, ITherapistLeaveModel>('TherapistLeave', TherapistLeaveSchema);

export default TherapistLeave;
