import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import AuditLog from '@/models/AuditLog';
import { AUDIT_ROLES, isAuditCategory } from '@/lib/audit-log-categories';
import { toAuditLogItem, AUDIT_LOG_ITEM_FIELDS } from '@/lib/utils/audit-log';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_LIMIT = 100;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/super-admin/activity-logs
 * Query:
 *   category  kategori, boleh lebih dari satu dipisah koma (account,finance)
 *   from, to  YYYY-MM-DD, dihitung sebagai hari WIB
 *   actorId   id user pelaku
 *   role      role pelaku (super_admin|admin|therapist|parent|system)
 *   q         cari di judul, deskripsi, nama pelaku, nama target
 *   page, limit (default 25, maks 100)
 *
 * Response juga membawa `categoryCounts` (jumlah per kategori untuk filter
 * selain kategori) dan `actors` (daftar pelaku untuk dropdown).
 */
export const GET = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const params = new URL(req.url).searchParams;

    const categories = (params.get('category') ?? '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (categories.some((c) => !isAuditCategory(c))) {
      return ErrorResponse.badRequest('Kategori tidak valid');
    }

    const from = params.get('from');
    const to = params.get('to');
    if ((from && !DATE_RE.test(from)) || (to && !DATE_RE.test(to))) {
      return ErrorResponse.badRequest('Format tanggal harus YYYY-MM-DD');
    }

    const actorId = params.get('actorId');
    if (actorId && !mongoose.isValidObjectId(actorId)) {
      return ErrorResponse.badRequest('actorId tidak valid');
    }

    const role = params.get('role');
    if (role && !(AUDIT_ROLES as readonly string[]).includes(role)) {
      return ErrorResponse.badRequest('Role tidak valid');
    }

    const q = (params.get('q') ?? '').trim().slice(0, 100);
    const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(params.get('limit') ?? '25', 10) || 25));

    // Filter selain kategori — dipakai juga untuk menghitung jumlah per kategori.
    const baseFilter: Record<string, unknown> = {};
    if (from || to) {
      baseFilter.createdAt = {
        ...(from && { $gte: new Date(`${from}T00:00:00+07:00`) }),
        ...(to && { $lte: new Date(`${to}T23:59:59.999+07:00`) }),
      };
    }
    if (actorId) baseFilter['actor.id'] = new mongoose.Types.ObjectId(actorId);
    if (role) baseFilter['actor.role'] = role;
    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      baseFilter.$or = [{ title: re }, { description: re }, { 'actor.name': re }, { 'target.name': re }];
    }

    const filter = categories.length ? { ...baseFilter, category: { $in: categories } } : baseFilter;

    await connectToDatabase();

    const [logs, total, categoryCounts, actors] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(AUDIT_LOG_ITEM_FIELDS)
        .lean(),
      AuditLog.countDocuments(filter),
      AuditLog.aggregate<{ _id: string; count: number }>([
        { $match: baseFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate<{ _id: mongoose.Types.ObjectId; name: string; role: string }>([
        { $match: { 'actor.id': { $ne: null } } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$actor.id', name: { $first: '$actor.name' }, role: { $first: '$actor.role' } } },
        { $sort: { name: 1 } },
        { $limit: 200 },
      ]),
    ]);


    return SuccessResponse.ok({
      logs: logs.map(toAuditLogItem),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      categoryCounts: Object.fromEntries(categoryCounts.map((c) => [c._id, c.count])),
      actors: actors.map((a) => ({ id: String(a._id), name: a.name, role: a.role })),
    });
  })
);
