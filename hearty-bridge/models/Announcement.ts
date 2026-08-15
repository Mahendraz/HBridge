import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnnouncementAttachment {
  fileName: string;
  fileType: 'image' | 'document';
  gcsPath: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  attachments: IAnnouncementAttachment[];
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementAttachmentSchema = new Schema<IAnnouncementAttachment>(
  {
    fileName:   { type: String, required: true, trim: true },
    fileType:   { type: String, enum: ['image', 'document'], required: true },
    gcsPath:    { type: String, required: true },
    url:        { type: String, required: true },
    mimeType:   { type: String, required: true },
    size:       { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    attachments: { type: [AnnouncementAttachmentSchema], default: [] },
    authorId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName:  { type: String, default: '', trim: true },
    isActive:    { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: 'announcements',
  }
);

AnnouncementSchema.index({ isActive: 1, createdAt: -1 });

const Announcement = (mongoose.models.Announcement as Model<IAnnouncement>) ||
  mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement;
