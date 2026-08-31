import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Session from '@/models/Session';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';
import mongoose from 'mongoose';

function getSessionId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  // /api/sessions/[id]
  return parts[parts.length - 1] ?? '';
}

/**
 * GET /api/sessions/[id]
 * Get a single session by ID.
 */
export const GET = withAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const sessionId = getSessionId(req);
    if (!mongoose.isValidObjectId(sessionId)) {
      return NextResponse.json(ErrorResponse.badRequest('Invalid session ID'), { status: 400 });
    }

    await connectToDatabase();

    const session = await Session.findOne({ _id: sessionId, isActive: true })
      .populate('therapistId', 'name email')
      .populate('childId', 'name')
      .lean();

    if (!session) {
      return NextResponse.json(ErrorResponse.notFound('Session'), { status: 404 });
    }

    return NextResponse.json(SuccessResponse.ok(session));
  })
);

/**
 * PATCH /api/sessions/[id]
 * Admin: update session date/time (reschedule) and/or status.
 * Body: { date?: 'YYYY-MM-DD', time?: 'HH:mm', status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show', notes?: string, force?: boolean }
 *
 * When status → 'completed': auto-deducts 1 token from child balance.
 * When status → 'no-show' or 'cancelled': no token deducted.
 * When date/time changes: no token effect, just moves the session in the calendar.
 *
 * If the new date+time collides with another active, non-cancelled session for the
 * same therapist, the request is rejected with 409 unless `force: true` is passed —
 * the caller (e.g. drag-and-drop reschedule in the schedule grid) is expected to
 * show the conflict to the admin and resubmit with force to override.
 */
export const PATCH = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const sessionId = getSessionId(req);
    if (!mongoose.isValidObjectId(sessionId)) {
      return NextResponse.json(ErrorResponse.badRequest('Invalid session ID'), { status: 400 });
    }

    await connectToDatabase();

    const session = await Session.findOne({ _id: sessionId, isActive: true });
    if (!session) {
      return NextResponse.json(ErrorResponse.notFound('Session'), { status: 404 });
    }

    const body = await req.json();
    const { date, time, status, notes, force } = body as {
      date?: string;
      time?: string;
      status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
      notes?: string;
      force?: boolean;
    };

    const VALID_STATUSES = ['scheduled', 'completed', 'cancelled', 'no-show'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        ErrorResponse.badRequest(`status must be one of: ${VALID_STATUSES.join(', ')}`),
        { status: 400 }
      );
    }

    if (time !== undefined && !/^\d{1,2}:\d{2}$/.test(time)) {
      return NextResponse.json(ErrorResponse.badRequest('Invalid time format'), { status: 400 });
    }

    const wasAlreadyCompleted = session.status === 'completed';

    // Resolve the target date/time (falling back to the session's current
    // values when only one of the two is being changed) and check for a
    // double-booking before applying anything.
    let parsedDate: Date | undefined;
    if (date !== undefined) {
      parsedDate = new Date(date + 'T00:00:00Z');
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(ErrorResponse.badRequest('Invalid date format'), { status: 400 });
      }
    }

    if ((date !== undefined || time !== undefined) && !force) {
      const targetDate = parsedDate ?? session.date;
      const targetTime = time ?? session.time;

      const conflict = await Session.findOne({
        _id: { $ne: session._id },
        therapistId: session.therapistId,
        date: targetDate,
        time: targetTime,
        status: { $ne: 'cancelled' },
        isActive: true,
      }).populate('childId', 'name');

      if (conflict) {
        const conflictChildName =
          (conflict.childId as unknown as { name?: string } | null)?.name || 'pasien lain';
        return NextResponse.json(
          {
            success: false,
            error: `Terapis sudah punya jadwal lain jam ${targetTime} untuk ${conflictChildName}.`,
            code: 'SCHEDULE_CONFLICT',
            conflict: true,
            conflictingSession: { childName: conflictChildName, time: targetTime },
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }
    }

    // Apply updates
    if (parsedDate) session.date = parsedDate;
    if (time !== undefined) session.time = time;
    if (status) session.status = status;
    if (notes !== undefined) session.notes = notes;

    await session.save();

    // Auto-deduct token when session is marked completed (only if not already completed before)
    if (status === 'completed' && !wasAlreadyCompleted) {
      const child = await Child.findOne({ _id: session.childId, isActive: true });
      if (child && child.tokenBalance > 0) {
        const balanceBefore = child.tokenBalance;
        child.tokenBalance = balanceBefore - 1;
        await child.save();

        const sessionLabel =
          session.sessionNumber && session.totalSessions
            ? `#${session.sessionNumber}/${session.totalSessions}`
            : '';

        await TokenTransaction.create({
          childId: session.childId,
          childName: child.name,
          adminId: new mongoose.Types.ObjectId(user.userId),
          adminName: user.name || '',
          type: 'deduct',
          packageType: null,
          amount: 1,
          balanceBefore,
          balanceAfter: child.tokenBalance,
          note: `Sesi ${sessionLabel} selesai`.trim(),
        });
      }
    }

    return NextResponse.json(SuccessResponse.ok({ session }));
  })
);
