/**
 * Kategori log aktivitas. Sengaja dipisah dari models/AuditLog.ts (tanpa
 * mongoose) supaya bisa di-import juga oleh halaman client untuk label & filter.
 */

export const AUDIT_CATEGORIES = [
  'account',
  'auth',
  'child',
  'schedule',
  'child_attendance',
  'staff_attendance',
  'report',
  'assessment',
  'finance',
  'leave',
  'announcement',
  'deletion',
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  account:          'Akun',
  auth:             'Login',
  child:            'Anak/Pasien',
  schedule:         'Jadwal',
  child_attendance: 'Kehadiran Anak',
  staff_attendance: 'Absensi Staf',
  report:           'Laporan',
  assessment:       'Asesmen',
  finance:          'Keuangan',
  leave:            'Cuti',
  announcement:     'Pengumuman',
  deletion:         'Hapus Akun',
};

export const AUDIT_ROLES = ['super_admin', 'admin', 'therapist', 'parent', 'system'] as const;
export type AuditRole = (typeof AUDIT_ROLES)[number];

export const AUDIT_ROLE_LABELS: Record<AuditRole, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  therapist:   'Terapis',
  parent:      'Orang tua',
  system:      'Sistem',
};

export function isAuditCategory(value: string): value is AuditCategory {
  return (AUDIT_CATEGORIES as readonly string[]).includes(value);
}

/** Bentuk item log yang dikirim API ke client. */
export interface AuditLogItem {
  id: string;
  category: AuditCategory;
  action: string;
  title: string;
  description: string;
  actor: { id: string | null; name: string; role: AuditRole };
  target: { type: string; id: string | null; name: string } | null;
  createdAt: string;
}
