import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Assessment from '@/models/Assessment';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';
import mongoose from 'mongoose';
import { z } from 'zod';

const createSchema = z.object({
  childId: z.string().min(1),
  assessorId: z.string().optional().nullable(),
  date: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(30).max(180).optional(),
  type: z.enum(['in-person', 'video']).optional(),
  notes: z.string().max(1000).optional(),
  packageId: z.string().optional().nullable(),
});

export const GET = withAnyAuth(async (req: NextRequest, user: any) => {
  try {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const childId = params.get('childId');
    const status  = params.get('status');
    const week    = params.get('week'); // YYYY-MM-DD (Monday)

    const query: Record<string, unknown> = { isActive: true };

    if (user.role === 'parent') {
      const children = await Child.find({ parentId: user.userId, isActive: true }).select('_id').lean();
      const childIds = children.map((c: any) => c._id);
      query.childId = { $in: childIds };
    } else {
      if (childId) query.childId = childId;
    }

    if (status) query.status = status;
    if (week) {
      const weekStart = new Date(week + 'T00:00:00Z');
      const weekEnd   = new Date(week + 'T00:00:00Z');
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      weekEnd.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: weekStart, $lte: weekEnd };
    }

    const assessments = await Assessment.find(query)
      .populate('childId', 'name')
      .populate('assessorId', 'name email')
      .populate('scheduledBy', 'name')
      .sort({ date: 1, time: 1 })
      .lean();

    return NextResponse.json({ success: true, assessments });
  } catch (err) {
    console.error('[GET /api/assessments]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const body = await req.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        ErrorResponse.badRequest('Data tidak valid', 'VALIDATION_ERROR', result.error.issues),
        { status: 400 }
      );
    }

    const { childId, assessorId, date, time, duration, type, notes, packageId } = result.data;

    let resolvedPackageId: mongoose.Types.ObjectId | null = null;
    if (packageId && mongoose.isValidObjectId(packageId)) {
      const tx = await TokenTransaction.findOne({
        _id: packageId,
        childId: new mongoose.Types.ObjectId(childId),
        type: 'topup',
        therapyType: 'assessment',
      }).lean();
      if (!tx) {
        return NextResponse.json(
          ErrorResponse.badRequest('Paket assessment tidak ditemukan atau bukan milik pasien ini'),
          { status: 400 }
        );
      }
      const existing = await Assessment.findOne({ packageId: new mongoose.Types.ObjectId(packageId), isActive: true }).lean();
      if (existing) {
        return NextResponse.json(
          ErrorResponse.badRequest('Paket assessment ini sudah dijadwalkan sebelumnya'),
          { status: 400 }
        );
      }
      resolvedPackageId = new mongoose.Types.ObjectId(packageId);
    }

    const assessment = await Assessment.create({
      childId,
      scheduledBy: user.userId,
      assessorId: assessorId || null,
      date: new Date(date + 'T00:00:00Z'),
      time,
      duration: duration ?? 60,
      type: type ?? 'in-person',
      notes: notes ?? '',
      status: 'scheduled',
      result: { OT: null, TW: null },
      ...(resolvedPackageId ? { packageId: resolvedPackageId, sessionNumber: 1, totalSessions: 1 } : {}),
    });

    const populated = await assessment.populate([
      { path: 'childId', select: 'name' },
      { path: 'assessorId', select: 'name email' },
    ]);

    return SuccessResponse.created({ assessment: populated });
  })
);
