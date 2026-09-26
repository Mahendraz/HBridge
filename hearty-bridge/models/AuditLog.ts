import mongoose, { Document, Model, Schema } from 'mongoose';
import { AUDIT_CATEGORIES, AUDIT_ROLES, type AuditCategory, type AuditRole } from '@/lib/audit-log-categories';

/**
 * Log aktivitas sistem yang tersimpan permanen (tanpa TTL), dibaca oleh
 * halaman Log Aktivitas & widget "Aktivitas Terbaru" super_admin.
 *
 * Ditulis lewat logActivity() di lib/utils/audit-log.ts — jangan create
 * langsung dari route. (models/SearchIndex.ts juga punya model ActivityLog
 * lama yang tidak dipakai; ini model terpisah.)
 */
export interface IAuditLog extends Document {
  category: AuditCategory;
  action: string;
  title: string;
  description: string;
  actor: {
    id: mongoose.Types.ObjectId | null;
    name: string;
    role: AuditRole;
  };
  target?: {
    type: string;
    id: mongoose.Types.ObjectId | null;
    name: string;
  };
  metadata: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export type IAuditLogModel = Model<IAuditLog>;

const AuditLogSchema = new Schema<IAuditLog>(
  {
    category: { type: String, enum: AUDIT_CATEGORIES, required: true },
    action:   { type: String, required: true, trim: true, maxlength: 100 },
    title:    { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    actor: {
      id:   { type: Schema.Types.ObjectId, ref: 'User', default: null },
      name: { type: String, default: '', trim: true },
      role: { type: String, enum: AUDIT_ROLES, required: true },
    },
    target: {
      type: new Schema(
        {
          type: { type: String, required: true, trim: true },
          id:   { type: Schema.Types.ObjectId, default: null },
          name: { type: String, default: '', trim: true },
        },
        { _id: false }
      ),
      required: false,
    },
    metadata:  { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'auditlogs',
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });
AuditLogSchema.index({ 'actor.id': 1, createdAt: -1 });

const AuditLog =
  (mongoose.models.AuditLog as IAuditLogModel) ||
  mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', AuditLogSchema);

export default AuditLog;
