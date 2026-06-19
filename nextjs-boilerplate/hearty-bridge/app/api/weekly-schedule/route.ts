import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import WeeklySchedule from '@/models/WeeklySchedule';
import Child from '@/models/Child';
import mongoose from 'mongoose';

/**
 * GET /api/weekly-schedule
 * Returns weekly schedule slots from MongoDB, filtered by role:
 *   admin/therapist → all slots
 *   parent          → only slots where patientId matches one of their children
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    let slots;

    if (user.role === 'parent') {
      // Find this parent's children
      const children = await Child.find({
        parentId: new mongoose.Types.ObjectId(user.id),
        isActive: true,
      }).select('_id').lean();

      const childIds = children.map((c: any) => c._id.toString());

      slots = await WeeklySchedule.find({
        patientId: { $in: childIds },
      })
        .sort({ day: 1, hour: 1 })
        .lean();
    } else {
      // admin and therapist see everything
      slots = await WeeklySchedule.find({})
        .sort({ day: 1, hour: 1 })
        .lean();
    }

    return NextResponse.json({ success: true, data: slots });
  })
);

/**
 * POST /api/weekly-schedule
 * Admin only: create or update a slot
 * Body: WeeklySlot (with optional _id for update)
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role !== 'admin') {
      return NextResponse.json(
        ErrorResponse.forbidden('Admin access required', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const { _id, ...data } = body;

    let slot;
    if (_id) {
      // Update existing slot
      slot = await WeeklySchedule.findByIdAndUpdate(
        _id,
        { $set: data },
        { new: true, runValidators: true }
      );
      if (!slot) {
        return NextResponse.json(
          ErrorResponse.notFound('Slot'),
          { status: 404 }
        );
      }
    } else {
      // Create new slot
      slot = await WeeklySchedule.create(data);
    }

    return NextResponse.json({ success: true, data: slot });
  })
);

/**
 * DELETE /api/weekly-schedule?id=<slotId>
 * Admin only: remove a slot
 */
export const DELETE = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role !== 'admin') {
      return NextResponse.json(
        ErrorResponse.forbidden('Admin access required', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    await connectToDatabase();

    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        ErrorResponse.badRequest('Missing slot id'),
        { status: 400 }
      );
    }

    const deleted = await WeeklySchedule.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        ErrorResponse.notFound('Slot'),
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  })
);
