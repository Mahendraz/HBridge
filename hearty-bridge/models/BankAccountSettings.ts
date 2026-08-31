import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBankAccount {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  notes?: string;
  isActive: boolean;
  order: number;
}

export interface IBankAccountSettings extends Document {
  accounts: IBankAccount[];
  updatedBy: mongoose.Types.ObjectId;
  updatedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBankAccountSettingsModel extends Model<IBankAccountSettings> {}

const BankAccountSchema = new Schema<IBankAccount>(
  {
    bankName:          { type: String, required: true, trim: true },
    accountNumber:     { type: String, required: true, trim: true },
    accountHolderName: { type: String, required: true, trim: true },
    notes:             { type: String, default: '', trim: true },
    isActive:          { type: Boolean, default: true },
    order:             { type: Number, default: 0 },
  },
  { _id: true }
);

const BankAccountSettingsSchema = new Schema<IBankAccountSettings>(
  {
    accounts:      { type: [BankAccountSchema], default: [] },
    updatedBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedByName: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
    collection: 'bank_account_settings',
  }
);

const BankAccountSettings =
  (mongoose.models.BankAccountSettings as IBankAccountSettingsModel) ||
  mongoose.model<IBankAccountSettings, IBankAccountSettingsModel>('BankAccountSettings', BankAccountSettingsSchema);

export default BankAccountSettings;
