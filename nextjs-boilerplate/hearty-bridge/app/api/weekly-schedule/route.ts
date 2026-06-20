import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import WeeklySchedule from '@/models/WeeklySchedule';
import Child from '@/models/Child';
import mongoose from 'mongoose';

/** Return the Monday (UTC) of the week containing the given date string, as a Date. */
function getMondayOfWeek(dateStr?: string): Date {
  const base = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  const day = base.getUTCDay(); // 0=Sun,1=Mon,...
  const toMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(base);
  mon.setUTCDate(base.getUTCDate() + toMon);
  mon.setUTCHours(0, 0, 0, 0);
  return mon;
}

/**
 * Given an array of schedule slots (possibly multiple versions per day+hour),
 * return only the active version for `weekStart`:
 *   - Keep only slots where effectiveFrom is null OR effectiveFrom <= weekStart
 *   - For each (day, hour), pick the one with the largest effectiveFrom
 *     (null treated as -Infinity / oldest)
 */
function deduplicateSlots(slots: any[], weekStart: Date): any[] {
  const map = new Map<string, any>();
  for (const slot of slots) {
    const key = `${slot.day}_${slot.hour}`;
    const slotDate = slot.effectiveFrom ? new Date(slot.effectiveFrom).getTime() : -Infinity;
    const existingSlot = map.get(key);
    const existingDate = existingSlot
      ? (existingSlot.effectiveFrom ? new Date(existingSlot.effectiveFrom).getTime() : -Infinity)
      : -Infinity;
    if (!existingSlot || slotDate > existingDate) {
      map.set(key, slot);
    }
  }
  return [...map.values()];
}

/**
 * GET /api/weekly-schedule?weekStart=YYYY-MM-DD
 * Returns the active schedule slots for the specified week.
 * Defaults to the current week if weekStart is omitted.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const weekStart = getMondayOfWeek(params.get('weekStart') ?? undefined);

    // Query all slots that could be active for this week:
    // effectiveFrom is null (legacy) OR effectiveFrom <= weekStart
    const query: any = {
      $or: [
        { effectiveFrom: null },
        { effectiveFrom: { $lte: weekStart } },
      ],
    };

    let allSlots: any[];

    if (user.role === 'parent') {
      const children = await Child.find({
        parentId: new mongoose.Types.ObjectId(user.userId),
        isActive: true,
      }).select('_id').lean();
      const childIds = children.map((c: any) => c._id.toString());
      query.patientId = { $in: childIds };
    }

    allSlots = await WeeklySchedule.find(query).lean();

    const activeSlots = deduplicateSlots(allSlots, weekStart);
    activeSlots.sort((a, b) => {
      const days = ['senin','selasa','rabu','kamis','jumat','sabtu'];
      const di = days.indexOf(a.day) - days.indexOf(b.day);
      return di !== 0 ? di : a.hour - b.hour;
    });

    return NextResponse.json({ success: true, data: activeSlots });
  })
);

/**
 * POST /api/weekly-schedule
 * Admin only: create or update a slot with versioning.
 * Body: WeeklySlot fields + effectiveFrom (YYYY-MM-DD string)
 *
 * Versioning logic:
 *   - If a slot with the same (day, hour, effectiveFrom) already exists → update it
 *   - Otherwise → create a new document (old versions are preserved)
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
    const { _id, effectiveFrom: effectiveFromStr, ...data } = body;

    // Parse effectiveFrom — default to Monday of current week
    const effectiveFrom = effectiveFromStr
      ? new Date(effectiveFromStr + 'T00:00:00Z')
      : getMondayOfWeek();

    // Check if a slot with the same (day, hour, effectiveFrom) already exists
    const existing = await WeeklySchedule.findOne({
      day: data.day,
      hour: data.hour,
      effectiveFrom,
    });

    let slot;
    if (existing) {
      // Idempotent update for same week
      slot = await WeeklySchedule.findByIdAndUpdate(
        existing._id,
        { $set: { ...data, effectiveFrom } },
        { new: true, runValidators: true }
      );
    } else {
      // New version — insert fresh document
      slot = await WeeklySchedule.create({ ...data, effectiveFrom });
    }

    return NextResponse.json({ success: true, data: slot });
  })
);

/**
 * DELETE /api/weekly-schedule?id=<slotId>
 * Admin only: remove a specific slot document by its _id.
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
