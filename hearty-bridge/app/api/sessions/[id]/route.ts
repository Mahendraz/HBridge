import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Session from '@/models/Session';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';
import mongoose from 'mongoose';
import { getInactiveTherapistError } from '@/lib/utils/therapist-leave';
import User from '@/models/User';
import { logActivity, type LogActivityInput } from '@/lib/utils/audit-log';

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
    const prevStatus = session.status;
    const prevDate = session.date ? new Date(session.date) : null;
    const prevTime = session.time;

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

    if (parsedDate) {
      const inactiveError = await getInactiveTherapistError(session.therapistId, parsedDate);
      if (inactiveError) {
        return NextResponse.json(ErrorResponse.badRequest(inactiveError), { status: 400 });
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

        // Tag the deduction with the session's package (name + program) so the
        // transaction history lines up per program with the sisa sesi count in
        // lib/utils/session-balance.ts, which counts completed sessions per package.
        const packageTx = session.packageId
          ? await TokenTransaction.findById(session.packageId)
              .select('packageType packageId therapyType')
              .lean<{ packageType: string | null; packageId: mongoose.Types.ObjectId | null; therapyType: 'OT' | 'TW' | 'assessment' | null }>()
          : null;
        const programLabel = packageTx?.therapyType && packageTx.therapyType !== 'assessment'
          ? ` ${packageTx.therapyType}`
          : '';

        await TokenTransaction.create({
          childId: session.childId,
          childName: child.name,
          adminId: new mongoose.Types.ObjectId(user.userId),
          adminName: user.name || '',
          type: 'deduct',
          packageType: packageTx?.packageType ?? null,
          packageId: packageTx?.packageId ?? null,
          therapyType: packageTx?.therapyType ?? null,
          amount: 1,
          balanceBefore,
          balanceAfter: child.tokenBalance,
          note: `Sesi${programLabel} ${sessionLabel} selesai`.replace(/\s+/g, ' ').trim(),
        });
      }
    }

    const rescheduled =
      (parsedDate !== undefined && parsedDate.getTime() !== prevDate?.getTime()) ||
      (time !== undefined && time !== prevTime);
    const statusChanged = status !== undefined && status !== prevStatus;

    if (rescheduled || statusChanged) {
      const [childDoc, therapistDoc] = await Promise.all([
        Child.findById(session.childId).select('name').lean<{ name?: string }>(),
        User.findById(session.therapistId).select('name').lean<{ name?: string }>(),
      ]);
      const childName = childDoc?.name ?? '';
      const ymd = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : '-');
      const sessionLabel = session.sessionNumber && session.totalSessions
        ? ` · Pertemuan ${session.sessionNumber}/${session.totalSessions}`
        : '';
      const detail = `Terapis: ${therapistDoc?.name || '—'} · ${ymd(session.date)} ${session.time ?? ''}${sessionLabel}`;
      const target = { type: 'session', id: session._id as mongoose.Types.ObjectId, name: childName };
      const meta = { childId: String(session.childId), therapistId: String(session.therapistId) };

      if (rescheduled) {
        logActivity(req, {
          category: 'schedule',
          action: 'session.rescheduled',
          title: `Sesi dijadwal ulang — ${childName}`,
          description: `${ymd(prevDate)} ${prevTime ?? ''} → ${ymd(session.date)} ${session.time ?? ''} · Terapis: ${therapistDoc?.name || '—'}`,
          actor: user,
          target,
          metadata: { ...meta, from: { date: ymd(prevDate), time: prevTime }, to: { date: ymd(session.date), time: session.time } },
        });
      }

      if (statusChanged) {
        const byStatus: Record<string, Pick<LogActivityInput, 'category' | 'action' | 'title'>> = {
          completed: { category: 'child_attendance', action: 'session.attended', title: `Anak hadir — ${childName}` },
          'no-show': { category: 'child_attendance', action: 'session.no_show', title: `Anak tidak hadir — ${childName}` },
          cancelled: { category: 'schedule', action: 'session.cancelled', title: `Sesi dibatalkan — ${childName}` },
          scheduled: { category: 'schedule', action: 'session.status_reset', title: `Status sesi dikembalikan ke terjadwal — ${childName}` },
        };
        logActivity(req, {
          ...byStatus[status],
          description: detail,
          actor: user,
          target,
          metadata: { ...meta, fromStatus: prevStatus, toStatus: status },
        });
      }
    }

    return NextResponse.json(SuccessResponse.ok({ session }));
  })
);
