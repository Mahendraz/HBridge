import { NextRequest } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import DeletionRequest from '@/models/DeletionRequest';
import { deleteChildAccount, deleteParentAccount } from '@/lib/utils/account-deletion';
import { notify } from '@/lib/utils/notify';
import { logActivity } from '@/lib/utils/audit-log';
import type { JWTPayload } from '@/lib/utils/jwt';
import mongoose from 'mongoose';
import { z } from 'zod';

function getRequestId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 1] ?? '';
}

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

/**
 * PATCH /api/deletion-requests/[id]
 * Super Admin approves (account gets deleted) or rejects a pending request.
 */
export const PATCH = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: JWTPayload) => {
    const id = getRequestId(req);
    if (!mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('ID tidak valid');

    await connectToDatabase();

    const result = reviewSchema.safeParse(await req.json());
    if (!result.success) {
      return ErrorResponse.badRequest('Data tidak valid', 'VALIDATION_ERROR', result.error.issues);
    }
    const { action, note } = result.data;

    // Claim the request atomically so a double click can't run the deletion twice.
    const request = await DeletionRequest.findOneAndUpdate(
      { _id: id, status: 'pending' },
      {
        $set: {
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewedBy: user.userId,
          reviewedByName: user.name,
          reviewedAt: new Date(),
          reviewNote: note?.trim() ?? '',
        },
      },
      { new: true }
    );
    if (!request) return ErrorResponse.notFound('Permintaan tidak ditemukan atau sudah diproses');

    let childrenDeleted = 0;
    if (action === 'approve') {
      const targetId = request.targetId.toString();
      if (request.targetType === 'parent') {
        ({ childrenDeleted } = await deleteParentAccount(targetId));
      } else {
        await deleteChildAccount(targetId);
      }
    }

    const label = request.targetType === 'parent' ? 'orang tua' : 'anak';
    await notify({
      recipientId: request.requestedBy,
      type: 'deletion_request',
      title:
        action === 'approve'
          ? `Akun ${label} ${request.targetName} telah dihapus`
          : `Permintaan hapus akun ${label} ${request.targetName} ditolak`,
      body: note?.trim() ? `Catatan Super Admin: ${note.trim()}` : '',
      link: '/dashboard/patients',
    });

    logActivity(req, {
      category: 'deletion',
      action: action === 'approve' ? 'deletion.approved' : 'deletion.rejected',
      title:
        action === 'approve'
          ? `Hapus akun ${label} disetujui — ${request.targetName}`
          : `Hapus akun ${label} ditolak — ${request.targetName}`,
      description: [
        `Diajukan oleh ${request.requestedByName}`,
        action === 'approve' && request.targetType === 'parent' ? `${childrenDeleted} data anak ikut dihapus` : '',
        note?.trim() ? `Catatan: ${note.trim()}` : '',
      ].filter(Boolean).join(' · '),
      actor: user,
      target: {
        type: request.targetType === 'parent' ? 'user' : 'child',
        id: request.targetId,
        name: request.targetName,
      },
      metadata: { requestId: request._id.toString(), targetType: request.targetType, childrenDeleted },
    });

    return SuccessResponse.ok(
      { request, childrenDeleted },
      action === 'approve' ? 'Akun berhasil dihapus' : 'Permintaan ditolak'
    );
  })
);
