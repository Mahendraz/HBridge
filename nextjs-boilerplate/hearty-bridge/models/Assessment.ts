import mongoose, { Schema, Document } from 'mongoose';

export interface IAssessmentResult {
  conducted: boolean;
  needsTherapy: boolean | null;
  notes: string;
}

export interface IAssessment extends Document {
  childId: mongoose.Types.ObjectId;
  scheduledBy: mongoose.Types.ObjectId;
  assessorId: mongoose.Types.ObjectId | null;
  date: Date;
  time: string;
  duration: number;
  type: 'in-person' | 'video';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
  result: {
    OT: IAssessmentResult | null;
    TW: IAssessmentResult | null;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentResultSchema = new Schema<IAssessmentResult>(
  {
    conducted: { type: Boolean, required: true },
    needsTherapy: { type: Boolean, default: null },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    childId: { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    scheduledBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assessorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    date: { type: Date, required: true },
    time: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    duration: { type: Number, default: 60, min: 30, max: 180 },
    type: { type: String, enum: ['in-person', 'video'], default: 'in-person' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    notes: { type: String, default: '' },
    result: {
      OT: { type: AssessmentResultSchema, default: null },
      TW: { type: AssessmentResultSchema, default: null },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AssessmentSchema.index({ childId: 1, date: -1 });
AssessmentSchema.index({ assessorId: 1, date: 1 });
AssessmentSchema.index({ date: 1, status: 1 });

export default mongoose.models.Assessment ||
  mongoose.model<IAssessment>('Assessment', AssessmentSchema);
