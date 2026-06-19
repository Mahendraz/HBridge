import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITokenTransaction extends Document {
  childId: mongoose.Types.ObjectId;
  childName: string;
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  type: 'topup' | 'deduct';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITokenTransactionModel extends Model<ITokenTransaction> {}

const TokenTransactionSchema = new Schema<ITokenTransaction>(
  {
    childId:      { type: Schema.Types.ObjectId, ref: 'Child', required: [true, 'Child ID is required'] },
    childName:    { type: String, default: '', trim: true },
    adminId:      { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Admin ID is required'] },
    adminName:    { type: String, default: '', trim: true },
    type: {
      type: String,
      enum: { values: ['topup', 'deduct'], message: 'Type must be topup or deduct' },
      required: [true, 'Transaction type is required'],
    },
    amount:        { type: Number, required: true, min: [1, 'Amount must be at least 1'] },
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter:  { type: Number, required: true, min: 0 },
    note:          { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
    collection: 'token_transactions',
  }
);

TokenTransactionSchema.index({ childId: 1, createdAt: -1 });

const TokenTransaction =
  (mongoose.models.TokenTransaction as ITokenTransactionModel) ||
  mongoose.model<ITokenTransaction, ITokenTransactionModel>(
    'TokenTransaction',
    TokenTransactionSchema
  );

export default TokenTransaction;
