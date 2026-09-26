import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import DeletionRequest from '@/models/DeletionRequest';
import User from '@/models/User';
import { findDeletionTarget } from '@/lib/utils/account-deletion';
import { notify } from '@/lib/utils/notify';
import { logActivity } from '@/lib/utils/audit-log';
import type { JWTPayload } from '@/lib/utils/jwt';
import mongoose from 'mongoose';
import { z } from 'zod';

const createSchema = z.object({
  targetType: z.enum(['parent', 'child']),
  targetId: z.string().refine((v) => mongoose.isValidObjectId(v), 'ID tidak valid'),
  reason: z.string().max(500).optional(),
});

/**
 * GET /api/deletion-requests?status=pending|approved|rejected|all
 * Super Admin sees every request; Admin only the ones they filed (enough to
 * know which accounts are already waiting for approval).
 */
export const GET = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: JWTPayload) => {
    await connectToDatabase();

    const status = new URL(req.url).searchParams.get('status') ?? 'pending';
    const query: Record<string, unknown> = {};
    if (['pending', 'approved', 'rejected'].includes(status)) query.status = status;
    if (user.role !== 'super_admin') query.requestedBy = new mongoose.Types.ObjectId(user.userId);

    const requests = await DeletionRequest.find(query).sort({ createdAt: -1 }).limit(200).lean();

    return SuccessResponse.ok({ requests });
  })
);

/**
 * POST /api/deletion-requests
 * Admin (or Super Admin) files a request to delete a parent or child account.
 * Nothing is deleted here — a Super Admin has to approve it first.
 */
export const POST = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: JWTPayload) => {
    await connectToDatabase();

    const result = createSchema.safeParse(await req.json());
    if (!result.success) {
      return ErrorResponse.badRequest('Data tidak valid', 'VALIDATION_ERROR', result.error.issues);
    }
    const { targetType, targetId, reason } = result.data;

    const target = await findDeletionTarget(targetType, targetId);
    if (!target) return ErrorResponse.notFound('Akun tidak ditemukan atau sudah dihapus');

    const existing = await DeletionRequest.findOne({ targetType, targetId, status: 'pending' }).lean();
    if (existing) return ErrorResponse.conflict('Akun ini sudah diajukan untuk dihapus dan masih menunggu persetujuan');

    const request = await DeletionRequest.create({
      targetType,
      targetId,
      targetName: target.name,
      relatedChildNames: target.relatedChildNames,
      reason: reason?.trim() ?? '',
      requestedBy: user.userId,
      requestedByName: user.name,
    });

    const superAdmins = await User.find({ role: 'super_admin', isActive: true }).select('_id').lean();
    const label = targetType === 'parent' ? 'orang tua' : 'anak';
    await Promise.all(
      superAdmins.map((sa) =>
        notify({
          recipientId: sa._id,
          type: 'deletion_request',
          title: `Permintaan hapus akun ${label}: ${target.name}`,
          body: `Diajukan oleh ${user.name}.${reason?.trim() ? ` Alasan: ${reason.trim()}` : ''}`,
          link: '/dashboard/super-admin/deletion-requests',
        })
      )
    );

    logActivity(req, {
      category: 'deletion',
      action: 'deletion.requested',
      title: `Permintaan hapus akun ${label} — ${target.name}`,
      description: `Diajukan oleh ${user.name}${reason?.trim() ? ` · Alasan: ${reason.trim()}` : ''}`,
      actor: user,
      target: { type: targetType === 'parent' ? 'user' : 'child', id: targetId, name: target.name },
      metadata: { requestId: request._id.toString(), targetType },
    });

    return SuccessResponse.created({ request }, 'Permintaan hapus akun dikirim ke Super Admin');
  })
);
