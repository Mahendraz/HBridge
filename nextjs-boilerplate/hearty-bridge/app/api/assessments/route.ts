import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Assessment from '@/models/Assessment';
import { z } from 'zod';

const createSchema = z.object({
  childId: z.string().min(1),
  assessorId: z.string().optional().nullable(),
  date: z.string().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(30).max(180).optional(),
  type: z.enum(['in-person', 'video']).optional(),
  notes: z.string().max(1000).optional(),
});

export const GET = withAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const childId = params.get('childId');
    const status = params.get('status');
    const week = params.get('week'); // YYYY-MM-DD (Monday)

    const query: Record<string, unknown> = { isActive: true };
    if (childId) query.childId = childId;
    if (status) query.status = status;
    if (week) {
      const weekStart = new Date(week + 'T00:00:00Z');
      const weekEnd = new Date(week + 'T00:00:00Z');
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

    return NextResponse.json(SuccessResponse.ok({ assessments }));
  })
);

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

    const { childId, assessorId, date, time, duration, type, notes } = result.data;

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
    });

    const populated = await assessment.populate([
      { path: 'childId', select: 'name' },
      { path: 'assessorId', select: 'name email' },
    ]);

    return NextResponse.json(SuccessResponse.created({ assessment: populated }), { status: 201 });
  })
);
