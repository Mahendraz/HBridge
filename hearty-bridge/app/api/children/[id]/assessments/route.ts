import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Assessment from '@/models/Assessment';
import Child from '@/models/Child';
import mongoose from 'mongoose';
import { therapistHasChild } from '@/lib/utils/therapist-access';

function getChildId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  // /api/children/[id]/assessments → parts[-2] is the child id
  return parts[parts.length - 2] ?? '';
}

export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const childId = getChildId(req);
    if (!mongoose.isValidObjectId(childId)) {
      return NextResponse.json(ErrorResponse.badRequest('Invalid child ID'), { status: 400 });
    }
    const child = await Child.findById(childId).lean();
    if (!child || !child.isActive) {
      return NextResponse.json(ErrorResponse.notFound('Anak'), { status: 404 });
    }

    if (user.role === 'parent') {
      if (child.parentId?.toString() !== user.userId) {
        return NextResponse.json(ErrorResponse.forbidden(), { status: 403 });
      }
    }

    // Therapists: their own patients, or children they are the assessor for.
    if (user.role === 'therapist') {
      const isAssessor = await Assessment.exists({ childId, assessorId: user.userId, isActive: true });
      if (!isAssessor && !(await therapistHasChild(user.userId, childId))) {
        return NextResponse.json(ErrorResponse.forbidden(), { status: 403 });
      }
    }

    const assessments = await Assessment.find({ childId, isActive: true })
      .populate('assessorId', 'name email profile.specialization')
      .populate('scheduledBy', 'name')
      .sort({ date: -1 })
      .lean();

    return NextResponse.json(SuccessResponse.ok({ assessments }));
  })
);
