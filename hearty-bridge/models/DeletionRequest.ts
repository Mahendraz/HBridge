import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Account deletion request (ADM-3). Admin files one for a parent or child
 * account; only Super Admin can approve/reject it. Approving soft-deletes the
 * account(s) — session, invoice and payment history stay untouched.
 */
export interface IDeletionRequest extends Document {
  targetType: 'parent' | 'child';
  targetId: mongoose.Types.ObjectId;
  // Snapshot so the request list stays readable after the account is gone.
  targetName: string;
  // Parent requests: names of the children that get deleted along with it.
  relatedChildNames: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: mongoose.Types.ObjectId;
  requestedByName: string;
  reviewedBy: mongoose.Types.ObjectId | null;
  reviewedByName: string;
  reviewedAt: Date | null;
  reviewNote: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IDeletionRequestModel = Model<IDeletionRequest>;

const DeletionRequestSchema = new Schema<IDeletionRequest>(
  {
    targetType:        { type: String, enum: ['parent', 'child'], required: true },
    targetId:          { type: Schema.Types.ObjectId, required: true, index: true },
    targetName:        { type: String, required: true, trim: true },
    relatedChildNames: { type: [String], default: [] },
    reason:            { type: String, default: '', trim: true, maxlength: 500 },
    status:            { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    requestedBy:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestedByName:   { type: String, required: true, trim: true },
    reviewedBy:        { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedByName:    { type: String, default: '', trim: true },
    reviewedAt:        { type: Date, default: null },
    reviewNote:        { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true, collection: 'deletion_requests' }
);

DeletionRequestSchema.index({ status: 1, createdAt: -1 });
DeletionRequestSchema.index({ targetType: 1, targetId: 1, status: 1 });

const DeletionRequest =
  (mongoose.models.DeletionRequest as IDeletionRequestModel) ||
  mongoose.model<IDeletionRequest, IDeletionRequestModel>('DeletionRequest', DeletionRequestSchema);

export default DeletionRequest;
