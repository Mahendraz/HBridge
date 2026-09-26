import { after, type NextRequest } from 'next/server';
import mongoose from 'mongoose';
import AuditLog, { type IAuditLog } from '@/models/AuditLog';
import connectToDatabase from '@/lib/db/mongodb';
import { getClientIp } from '@/lib/middleware/auth';
import { AUDIT_ROLE_LABELS, type AuditCategory, type AuditLogItem, type AuditRole } from '@/lib/audit-log-categories';
import type { JWTPayload } from '@/lib/utils/jwt';

type IdLike = string | mongoose.Types.ObjectId | null | undefined;

export interface LogActivityInput {
  category: AuditCategory;
  /** Kode aksi, format `<entitas>.<aksi>`, mis. `user.created`, `session.no_show`. */
  action: string;
  title: string;
  description?: string;
  /** User yang login (payload JWT), atau pelaku manual (mis. email saat login gagal). */
  actor: JWTPayload | { id?: IdLike; name: string; role: AuditRole };
  target?: { type: string; id?: IdLike; name?: string };
  /** Detail tambahan. JANGAN isi password, token, hash, atau isi laporan. */
  metadata?: Record<string, unknown>;
}

function toObjectId(id: IdLike): mongoose.Types.ObjectId | null {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;
}

function normalizeActor(actor: LogActivityInput['actor']) {
  if ('userId' in actor) {
    return { id: toObjectId(actor.userId), name: actor.name || actor.email || '', role: actor.role as AuditRole };
  }
  return { id: toObjectId(actor.id), name: actor.name, role: actor.role };
}

async function write(doc: Record<string, unknown>) {
  try {
    // Route seperti logout tidak connect sendiri; koneksi di-cache, jadi murah.
    await connectToDatabase();
    await AuditLog.create(doc);
  } catch (err) {
    console.error('[audit-log] gagal mencatat aktivitas:', err);
  }
}

/**
 * Catat satu aktivitas ke AuditLog. Tidak pernah throw dan tidak menahan
 * response: penulisan dijadwalkan lewat after() setelah response terkirim,
 * jadi kegagalan log tidak menggagalkan aksi utamanya.
 */
export function logActivity(request: NextRequest | null, input: LogActivityInput): void {
  const doc = {
    category: input.category,
    action: input.action,
    title: input.title,
    description: input.description ?? '',
    actor: normalizeActor(input.actor),
    target: input.target
      ? { type: input.target.type, id: toObjectId(input.target.id), name: input.target.name ?? '' }
      : undefined,
    metadata: input.metadata ?? {},
    ipAddress: request ? getClientIp(request) : undefined,
  };

  try {
    after(() => write(doc));
  } catch {
    // Di luar request scope (script/test): tulis langsung, tetap tanpa throw.
    void write(doc);
  }
}

/** Label role untuk judul log, mis. "Terapis baru terdaftar". */
export function roleLabel(role: string): string {
  return AUDIT_ROLE_LABELS[role as AuditRole] ?? role;
}

/** Field yang perlu di-select dari AuditLog untuk toAuditLogItem(). */
export const AUDIT_LOG_ITEM_FIELDS = 'category action title description actor target createdAt';

/** Ubah dokumen AuditLog (hasil .lean()) jadi item yang dikirim ke client. */
export function toAuditLogItem(
  l: Pick<IAuditLog, 'category' | 'action' | 'title' | 'description' | 'actor' | 'target' | 'createdAt'> & { _id: unknown }
): AuditLogItem {
  return {
    id: String(l._id),
    category: l.category,
    action: l.action,
    title: l.title,
    description: l.description ?? '',
    actor: { id: l.actor?.id ? String(l.actor.id) : null, name: l.actor?.name ?? '', role: l.actor?.role ?? 'system' },
    target: l.target
      ? { type: l.target.type, id: l.target.id ? String(l.target.id) : null, name: l.target.name ?? '' }
      : null,
    createdAt: new Date(l.createdAt).toISOString(),
  };
}
