import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWeeklySchedule extends Document {
  day: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu';
  hour: number;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  therapyType: 'OT' | 'TW';
  diagnosis: string;
  notes: string;
  effectiveFrom: Date | null;
  packageId: string | null;
  totalSessions: number | null;
  effectiveUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeeklyScheduleModel extends Model<IWeeklySchedule> {}

const WeeklyScheduleSchema = new Schema<IWeeklySchedule>(
  {
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'],
    },
    hour: {
      type: Number,
      required: [true, 'Hour is required'],
      min: [9, 'Hour must be between 9 and 16'],
      max: [16, 'Hour must be between 9 and 16'],
    },
    patientId:    { type: String, required: [true, 'Patient ID is required'] },
    patientName:  { type: String, required: [true, 'Patient name is required'], trim: true },
    therapistId:  { type: String, required: [true, 'Therapist ID is required'] },
    therapistName:{ type: String, required: [true, 'Therapist name is required'], trim: true },
    therapyType:  { type: String, required: [true, 'Therapy type is required'], enum: ['OT', 'TW'], trim: true },
    diagnosis:    { type: String, default: '', trim: true },
    notes:        { type: String, default: '', trim: true },
    effectiveFrom: { type: Date, default: null, index: true },
    packageId:    { type: String, default: null },
    totalSessions:{ type: Number, default: null },
    effectiveUntil: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'weeklyschedules',
  }
);

WeeklyScheduleSchema.index({ day: 1, hour: 1 });
WeeklyScheduleSchema.index({ day: 1, hour: 1, effectiveFrom: 1 });
WeeklyScheduleSchema.index({ therapistId: 1 });
WeeklyScheduleSchema.index({ patientId: 1 });

const WeeklySchedule = (mongoose.models.WeeklySchedule as IWeeklyScheduleModel) ||
  mongoose.model<IWeeklySchedule, IWeeklyScheduleModel>('WeeklySchedule', WeeklyScheduleSchema);

export default WeeklySchedule;
