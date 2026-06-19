import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  userId:   mongoose.Types.ObjectId;
  userName: string;
  userRole: 'admin' | 'therapist';
  /** 'YYYY-MM-DD' in WIB — unique per user per calendar day */
  date:     string;
  checkInAt:       Date;
  checkInLocation: { lat: number; lng: number };
  isWithinLocation: boolean;
  status: 'on-time' | 'late';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceModel extends Model<IAttendance> {}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User ID is required'] },
    userName: { type: String, default: '', trim: true },
    userRole: {
      type: String,
      enum: { values: ['admin', 'therapist'], message: 'Role must be admin or therapist' },
      required: [true, 'User role is required'],
    },
    date:     { type: String, required: [true, 'Date is required'] },
    checkInAt: { type: Date, required: [true, 'Check-in time is required'] },
    checkInLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    isWithinLocation: { type: Boolean, required: true },
    status: {
      type: String,
      enum: { values: ['on-time', 'late'], message: 'Status must be on-time or late' },
      required: [true, 'Status is required'],
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
    collection: 'attendances',
  }
);

// Unique: one record per user per calendar day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ userRole: 1, date: 1 });

const Attendance =
  (mongoose.models.Attendance as IAttendanceModel) ||
  mongoose.model<IAttendance, IAttendanceModel>('Attendance', AttendanceSchema);

export default Attendance;
