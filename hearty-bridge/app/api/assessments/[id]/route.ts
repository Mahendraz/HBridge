import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Assessment from '@/models/Assessment';
import mongoose from 'mongoose';
import { therapistHasChild } from '@/lib/utils/therapist-access';
import { logActivity } from '@/lib/utils/audit-log';
import { z } from 'zod';

function getAssessmentId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 1] ?? '';
}

const resultSchema = z.object({
  conducted: z.boolean(),
  needsTherapy: z.boolean().nullable().optional(),
  notes: z.string().max(2000).optional(),
});

const patchSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no-show']).optional(),
  result: z
    .object({
      OT: resultSchema.nullable().optional(),
      TW: resultSchema.nullable().optional(),
    })
    .optional(),
  notes: z.string().max(1000).optional(),
  assessorId: z.string().nullable().optional(),
});

export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const id = getAssessmentId(req);
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(ErrorResponse.notFound('Asesmen'), { status: 404 });
    }
    const assessment = await Assessment.findById(id)
      .populate('childId', 'name parentId')
      .populate('assessorId', 'name email')
      .populate('scheduledBy', 'name')
      .lean();

    if (!assessment || !assessment.isActive) {
      return NextResponse.json(ErrorResponse.notFound('Asesmen'), { status: 404 });
    }

    if (user.role === 'parent') {
      const child = assessment.childId as any;
      if (child?.parentId?.toString() !== user.userId) {
        return NextResponse.json(ErrorResponse.forbidden(), { status: 403 });
      }
    }

    // Therapists: the assessor, or a therapist treating the child.
    if (user.role === 'therapist') {
      const assessorId = (assessment.assessorId as any)?._id?.toString() ?? assessment.assessorId?.toString();
      const childId = (assessment.childId as any)?._id?.toString() ?? '';
      if (assessorId !== user.userId && !(await therapistHasChild(user.userId, childId))) {
        return NextResponse.json(ErrorResponse.forbidden(), { status: 403 });
      }
    }

    return NextResponse.json(SuccessResponse.ok({ assessment }));
  })
);

export const PATCH = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const id = getAssessmentId(req);
    const assessment = await Assessment.findById(id);
    if (!assessment || !assessment.isActive) {
      return NextResponse.json(ErrorResponse.notFound('Asesmen'), { status: 404 });
    }

    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const isAssessor =
      user.role === 'therapist' &&
      assessment.assessorId?.toString() === user.userId;

    if (!isAdmin && !isAssessor) {
      return NextResponse.json(ErrorResponse.forbidden(), { status: 403 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        ErrorResponse.badRequest('Data tidak valid', 'VALIDATION_ERROR', parsed.error.issues),
        { status: 400 }
      );
    }

    const { status, result, notes, assessorId } = parsed.data;

    if (isAssessor && !isAdmin) {
      if (status !== undefined || assessorId !== undefined) {
        return NextResponse.json(ErrorResponse.forbidden(), { status: 403 });
      }
    }

    const previousStatus = assessment.status;
    if (status !== undefined) assessment.status = status;
    if (notes !== undefined) assessment.notes = notes;
    if (assessorId !== undefined) assessment.assessorId = assessorId as any;
    if (result !== undefined) {
      if (result.OT !== undefined) assessment.result.OT = result.OT as any;
      if (result.TW !== undefined) assessment.result.TW = result.TW as any;
      if ((result.OT || result.TW) && assessment.status === 'scheduled') {
        assessment.status = 'completed';
      }
    }

    await assessment.save();

    const populated = await assessment.populate([
      { path: 'childId', select: 'name' },
      { path: 'assessorId', select: 'name email' },
    ]);

    const childName = (populated.childId as unknown as { name?: string } | null)?.name ?? '';
    const dateLabel = `${assessment.date.toISOString().slice(0, 10)} ${assessment.time}`;
    const target = { type: 'assessment', id: assessment._id, name: childName };
    const statusChanged = assessment.status !== previousStatus;
    const attendanceLogged =
      statusChanged && (assessment.status === 'completed' || assessment.status === 'no-show');

    if (attendanceLogged) {
      const attended = assessment.status === 'completed';
      logActivity(req, {
        category: 'child_attendance',
        action: attended ? 'assessment.attended' : 'assessment.no_show',
        title: `Anak ${attended ? 'hadir' : 'tidak hadir'} (asesmen) — ${childName}`,
        description: dateLabel,
        actor: user,
        target,
        metadata: { from: previousStatus, to: assessment.status },
      });
    }

    if (result !== undefined || notes !== undefined || assessorId !== undefined || (statusChanged && !attendanceLogged)) {
      const action = result !== undefined
        ? 'assessment.result_recorded'
        : statusChanged && !attendanceLogged
          ? (assessment.status === 'cancelled' ? 'assessment.cancelled' : 'assessment.status_changed')
          : 'assessment.updated';
      const titles: Record<string, string> = {
        'assessment.result_recorded': 'Hasil asesmen diisi',
        'assessment.cancelled':       'Asesmen dibatalkan',
        'assessment.status_changed':  'Status asesmen diubah',
        'assessment.updated':         'Asesmen diperbarui',
      };
      logActivity(req, {
        category: 'assessment',
        action,
        title: `${titles[action]} — ${childName}`,
        description: statusChanged ? `${dateLabel} · ${previousStatus} → ${assessment.status}` : dateLabel,
        actor: user,
        target,
        metadata: {
          fields: Object.keys(parsed.data),
          ...(statusChanged && { from: previousStatus, to: assessment.status }),
        },
      });
    }

    return NextResponse.json(SuccessResponse.ok({ assessment: populated }));
  })
);

export const DELETE = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(ErrorResponse.forbidden(), { status: 403 });
    }

    const id = getAssessmentId(req);
    const assessment = await Assessment.findById(id);
    if (!assessment || !assessment.isActive) {
      return NextResponse.json(ErrorResponse.notFound('Asesmen'), { status: 404 });
    }

    assessment.isActive = false;
    await assessment.save();

    await assessment.populate({ path: 'childId', select: 'name' });
    const childName = (assessment.childId as unknown as { name?: string } | null)?.name ?? '';
    logActivity(req, {
      category: 'assessment',
      action: 'assessment.deleted',
      title: `Asesmen dihapus — ${childName}`,
      description: `${assessment.date.toISOString().slice(0, 10)} ${assessment.time} · ${assessment.status}`,
      actor: user,
      target: { type: 'assessment', id: assessment._id, name: childName },
    });

    return NextResponse.json(SuccessResponse.ok({ message: 'Asesmen dihapus' }));
  })
);
