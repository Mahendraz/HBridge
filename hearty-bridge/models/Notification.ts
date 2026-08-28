import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: 'new_invoice' | 'new_comment' | 'new_report';
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationModel extends Model<INotification> {}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['new_invoice', 'new_comment', 'new_report'], required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '', trim: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification =
  (mongoose.models.Notification as INotificationModel) ||
  mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema);

export default Notification;
