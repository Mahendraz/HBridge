import { NextRequest } from 'next/server';
import { withSuperAdminAuth, withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import TherapistLeave from '@/models/TherapistLeave';
import User from '@/models/User';
import mongoose from 'mongoose';
import { z } from 'zod';
import { normalizeLeaveType, getLeaveScheduleWarning } from '@/lib/utils/therapist-leave';

const createSchema = z.object({
  userId:    z.string().min(1),
  // 'cuti' is the legacy name of 'sakit_izin' — still accepted, stored as 'sakit_izin'.
  type:      z.enum(['sakit_izin', 'inactive', 'cuti']).transform(normalizeLeaveType),
  startDate: z.string().min(1),
  endDate:   z.string().nullable().optional(),
  reason:    z.string().max(500).optional(),
});

/**
 * GET /api/therapist-leaves
 * Query params: userId, from (YYYY-MM-DD), to (YYYY-MM-DD), status (active|cancelled|all)
 * super_admin/admin: see all or filter by userId
 * therapist: own only
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const userId   = params.get('userId');
    const from     = params.get('from');
    const to       = params.get('to');
    const status   = params.get('status') ?? 'active';

    const query: Record<string, unknown> = {};

    if (user.role === 'super_admin' || user.role === 'admin') {
      if (userId && mongoose.isValidObjectId(userId)) {
        query.userId = new mongoose.Types.ObjectId(userId);
      }
    } else {
      // therapist/parent: own only
      query.userId = new mongoose.Types.ObjectId(user.userId);
    }

    if (status !== 'all') query.status = status;

    // Date range overlap: leave overlaps [from, to] if startDate <= to AND (endDate >= from OR endDate is null)
    if (from || to) {
      const andClauses: Record<string, unknown>[] = [];
      if (to) andClauses.push({ startDate: { $lte: new Date(to + 'T23:59:59Z') } });
      if (from) {
        andClauses.push({
          $or: [
            { endDate: null },
            { endDate: { $gte: new Date(from + 'T00:00:00Z') } },
          ],
        });
      }
      if (andClauses.length > 0) query.$and = andClauses;
    }

    const rawLeaves = await TherapistLeave.find(query)
      .sort({ startDate: -1 })
      .lean();
    // Legacy 'cuti' records are reported as 'sakit_izin' so clients only see the two current types.
    const leaves = rawLeaves.map((lv) => ({ ...lv, type: normalizeLeaveType(lv.type) }));

    return SuccessResponse.ok({ leaves });
  })
);

/**
 * POST /api/therapist-leaves
 * super_admin only. Creates a leave record for a therapist or admin.
 */
export const POST = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return ErrorResponse.badRequest('Data tidak valid', 'VALIDATION_ERROR', result.error.issues);
    }

    const { userId, type, startDate, endDate, reason } = result.data;

    if (!mongoose.isValidObjectId(userId)) {
      return ErrorResponse.badRequest('userId tidak valid');
    }

    const targetUser = await User.findOne({
      _id: userId,
      role: { $in: ['therapist', 'admin'] },
    }).select('name role').lean();

    if (!targetUser) {
      return ErrorResponse.notFound('Terapis atau Admin tidak ditemukan');
    }

    const start = new Date(startDate + 'T00:00:00Z');
    const end   = endDate ? new Date(endDate + 'T23:59:59Z') : null;

    const leave = await TherapistLeave.create({
      userId:       new mongoose.Types.ObjectId(userId),
      userName:     (targetUser as any).name as string,
      userRole:     (targetUser as any).role as 'therapist' | 'admin',
      type,
      startDate:    start,
      endDate:      end,
      reason:       reason ?? '',
      status:       'active',
      createdBy:    new mongoose.Types.ObjectId(user.userId),
      createdByName: user.name || '',
    });

    // Existing slots are not moved — the admin gets a warning to reassign them.
    const warning = (targetUser as { role?: string }).role === 'therapist'
      ? await getLeaveScheduleWarning(userId, type, start, end)
      : null;

    return SuccessResponse.created({ leave, warning });
  })
);
