import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  childId: mongoose.Types.ObjectId;
  childName: string;
  parentId: mongoose.Types.ObjectId;
  packageTransactionId: mongoose.Types.ObjectId;
  packageId?: mongoose.Types.ObjectId | null;
  packageType: string;
  therapyType: 'OT' | 'TW' | 'both' | 'assessment';
  sessions: number;
  originalAmount: number;
  discountAmount: number;
  amount: number;
  dueDate: Date;
  status: 'unpaid' | 'paid' | 'overdue';
  paidAt: Date | null;
  isVisibleToParent: boolean;
  notes: string;
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  paymentProofKey?: string | null;
  paymentMessage?: string;
  paymentSubmittedAt?: Date | null;
  seenByParentAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoiceModel extends Model<IInvoice> {}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    childId:       { type: Schema.Types.ObjectId, ref: 'Child', required: true },
    childName:     { type: String, required: true, trim: true },
    parentId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    packageTransactionId: { type: Schema.Types.ObjectId, ref: 'TokenTransaction', required: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', default: null },
    packageType: { type: String, required: true, trim: true },
    therapyType: {
      type: String,
      enum: ['OT', 'TW', 'both', 'assessment'],
      required: true,
    },
    sessions:        { type: Number, required: true, min: 1 },
    originalAmount:  { type: Number, default: 0 },
    discountAmount:  { type: Number, default: 0 },
    amount:          { type: Number, required: true, min: 0 },
    dueDate:           { type: Date, required: true },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'overdue'],
      default: 'unpaid',
      index: true,
    },
    paidAt:            { type: Date, default: null },
    isVisibleToParent: { type: Boolean, default: false, index: true },
    notes:             { type: String, default: '', trim: true },
    adminId:           { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminName:         { type: String, default: '', trim: true },
    paymentProofKey:    { type: String, default: null },
    paymentMessage:     { type: String, default: '' },
    paymentSubmittedAt: { type: Date, default: null },
    seenByParentAt:     { type: Date, default: null },
    isActive:           { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    collection: 'invoices',
  }
);

InvoiceSchema.index({ childId: 1 });
InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

const Invoice =
  (mongoose.models.Invoice as IInvoiceModel) ||
  mongoose.model<IInvoice, IInvoiceModel>('Invoice', InvoiceSchema);

export default Invoice;
