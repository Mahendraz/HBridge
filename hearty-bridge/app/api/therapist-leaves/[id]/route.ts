import { NextRequest } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import TherapistLeave from '@/models/TherapistLeave';
import mongoose from 'mongoose';
import { z } from 'zod';

function getLeaveId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 1] ?? '';
}

const updateSchema = z.object({
  type:      z.enum(['cuti', 'inactive']).optional(),
  startDate: z.string().optional(),
  endDate:   z.string().nullable().optional(),
  reason:    z.string().max(500).optional(),
});

/**
 * PATCH /api/therapist-leaves/[id]
 * Update dates, type, or reason. super_admin only.
 */
export const PATCH = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const id = getLeaveId(req);
    if (!mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('ID tidak valid');

    await connectToDatabase();

    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) return ErrorResponse.badRequest('Data tidak valid');

    const update: Record<string, unknown> = {};
    if (result.data.type)      update.type      = result.data.type;
    if (result.data.startDate) update.startDate = new Date(result.data.startDate + 'T00:00:00Z');
    if ('endDate' in result.data) {
      update.endDate = result.data.endDate ? new Date(result.data.endDate + 'T23:59:59Z') : null;
    }
    if (result.data.reason !== undefined) update.reason = result.data.reason;

    const leave = await TherapistLeave.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();

    if (!leave) return ErrorResponse.notFound('Leave record tidak ditemukan');

    return SuccessResponse.ok({ leave });
  })
);

/**
 * DELETE /api/therapist-leaves/[id]
 * Soft-cancel: sets status = 'cancelled'. super_admin only.
 */
export const DELETE = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const id = getLeaveId(req);
    if (!mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('ID tidak valid');

    await connectToDatabase();

    const leave = await TherapistLeave.findByIdAndUpdate(
      id,
      { $set: { status: 'cancelled' } },
      { new: true }
    ).lean();

    if (!leave) return ErrorResponse.notFound('Leave record tidak ditemukan');

    return SuccessResponse.ok({ leave });
  })
);
