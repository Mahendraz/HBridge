import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import WeeklySchedule, { type IWeeklySchedule } from '@/models/WeeklySchedule';
import Session from '@/models/Session';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';
import {
  dateToDayName,
  DAY_TO_IDX,
  nextOccurrenceOf,
  regeneratePackageSchedule,
} from '@/lib/utils/package-schedule';
import mongoose from 'mongoose';
import { getInactiveTherapistError } from '@/lib/utils/therapist-leave';

/** Return the Monday (UTC) of the week containing the given date string, as a Date. */
function getMondayOfWeek(dateStr?: string): Date {
  const base = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  const day = base.getUTCDay();
  const toMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(base);
  mon.setUTCDate(base.getUTCDate() + toMon);
  mon.setUTCHours(0, 0, 0, 0);
  return mon;
}

function timeToHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

const DAY_MS = 24 * 3600 * 1000;

/**
 * "Semua minggu berikutnya" for a drag-drop reschedule in the schedule grid.
 *
 * Moves the dragged Session to `date`/`time`, plus every later still-'scheduled'
 * regular session of the same package that sits on the same weekday + time
 * (i.e. the rest of that recurring series), each shifted by the same number of
 * days — so a Senin 10:00 → Rabu 13:00 drop turns every following Senin 10:00
 * into Rabu 13:00, and a drop onto the adjacent week shifts the whole series
 * by a week. The WeeklySchedule template behind the series is repointed to
 * the new day/hour in place.
 *
 * Deliberately not done via a second versioned template + regeneratePackageSchedule:
 * that helper collapses linked slots per *day*, so an old Senin doc and a new
 * Rabu doc on the same package would be read as a 2x/week package, and it
 * re-derives dates from "today", which would drag any not-yet-moved sessions
 * between now and the dropped week along too. Repointing the template in place
 * is safe for past weeks: GET hides a package slot whose week already has a
 * session elsewhere and shows that session as a standalone card instead.
 *
 * Only the Session PATCH (`/api/sessions/[id]`) handles "Hanya minggu ini".
 */
async function moveRecurringSeries(body: {
  sessionId?: string;
  date?: string;
  time?: string;
  force?: boolean;
}): Promise<NextResponse> {
  const { sessionId, date, time, force } = body;

  if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
    return NextResponse.json(ErrorResponse.badRequest('Invalid session ID'), { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !time || !/^\d{1,2}:\d{2}$/.test(time)) {
    return NextResponse.json(ErrorResponse.badRequest('date (YYYY-MM-DD) dan time (HH:mm) diperlukan'), { status: 400 });
  }

  const newHour = timeToHour(time);
  if (newHour < 9 || newHour > 17) {
    return NextResponse.json(ErrorResponse.badRequest('Jam harus antara 09:00 dan 17:00'), { status: 400 });
  }

  const targetDate = new Date(date + 'T00:00:00Z');
  if (isNaN(targetDate.getTime())) {
    return NextResponse.json(ErrorResponse.badRequest('Invalid date format'), { status: 400 });
  }
  const newDay = dateToDayName(targetDate);
  if (newDay === 'minggu') {
    return NextResponse.json(ErrorResponse.badRequest('Tidak ada jadwal di hari Minggu'), { status: 400 });
  }

  const session = await Session.findOne({ _id: sessionId, isActive: true });
  if (!session) {
    return NextResponse.json(ErrorResponse.notFound('Session'), { status: 404 });
  }
  if (!session.packageId) {
    return NextResponse.json(
      ErrorResponse.badRequest('Sesi ini tidak terikat paket, jadi hanya bisa dipindah untuk minggu ini.'),
      { status: 400 }
    );
  }
  if (session.sessionCategory === 'extra') {
    return NextResponse.json(
      ErrorResponse.badRequest('Sesi susulan tidak berulang, jadi hanya bisa dipindah untuk minggu ini.'),
      { status: 400 }
    );
  }

  const sessionDate = new Date(session.date);
  sessionDate.setUTCHours(0, 0, 0, 0);
  const patientId = session.childId.toString();
  const packageIdStr = session.packageId.toString();

  // Find the recurring slot this session belongs to. Normally that is the slot
  // at the session's own day/hour, but a session already moved "hanya minggu
  // ini" sits somewhere else — then the slot is the one left empty that week.
  const slots = await WeeklySchedule.find({ patientId, packageId: packageIdStr })
    .select('day hour')
    .lean<{ day: string; hour: number }[]>();
  const uniqueSlots = [...new Map(slots.map((sl) => [`${sl.day}-${sl.hour}`, sl])).values()];
  const weekMonday = getMondayOfWeek(sessionDate.toISOString().split('T')[0]);
  const slotDateInWeek = (day: string) => {
    const d = new Date(weekMonday);
    d.setUTCDate(weekMonday.getUTCDate() + (DAY_TO_IDX[day] ?? 1) - 1);
    return d;
  };

  let anchor = uniqueSlots.find(
    (sl) => sl.day === dateToDayName(sessionDate) && sl.hour === timeToHour(session.time)
  );
  if (!anchor) {
    const weekEnd = new Date(weekMonday.getTime() + 7 * DAY_MS);
    const weekSessions = await Session.find({
      _id: { $ne: session._id },
      packageId: session.packageId,
      isActive: true,
      sessionCategory: { $ne: 'extra' as const },
      date: { $gte: weekMonday, $lt: weekEnd },
    }).select('date time').lean();
    const emptySlots = uniqueSlots.filter((sl) => {
      const slotDate = slotDateInWeek(sl.day).getTime();
      return !weekSessions.some(
        (ws) => new Date(ws.date).getTime() === slotDate && timeToHour(ws.time) === sl.hour
      );
    });
    if (emptySlots.length === 1) anchor = emptySlots[0];
  }
  if (!anchor) {
    return NextResponse.json(
      ErrorResponse.badRequest(
        'Jadwal rutin asal sesi ini tidak bisa ditentukan (sesi ini sudah pernah dipindah). Pindahkan dengan pilihan "Hanya minggu ini", atau ubah jadwal rutinnya lewat detail jadwal.'
      ),
      { status: 400 }
    );
  }

  const oldDay = anchor.day;
  const oldHour = anchor.hour;
  const anchorDate = slotDateInWeek(oldDay);
  const shiftDays = Math.round((targetDate.getTime() - anchorDate.getTime()) / DAY_MS);

  const laterSeries = (await Session.find({
    _id: { $ne: session._id },
    packageId: session.packageId,
    isActive: true,
    sessionCategory: { $ne: 'extra' as const },
    status: 'scheduled',
    date: { $gt: anchorDate },
  }).lean()).filter(
    (s) => dateToDayName(new Date(s.date)) === oldDay && timeToHour(s.time) === oldHour
  );

  type SeriesSession = { _id: mongoose.Types.ObjectId; therapistId: mongoose.Types.ObjectId; date: Date };
  const series = [session, ...laterSeries] as SeriesSession[];
  const moves = series.map((s) => {
    // The dragged session lands exactly where it was dropped; the rest of the
    // series shifts by the same offset from the recurring slot.
    if (s._id.equals(session._id)) return { _id: s._id, therapistId: s.therapistId, date: targetDate };
    const d = new Date(s.date);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + shiftDays);
    return { _id: s._id, therapistId: s.therapistId, date: d };
  });

  if (!force) {
    const conflicts = await Session.find({
      _id: { $nin: moves.map((m) => m._id) },
      status: { $ne: 'cancelled' },
      isActive: true,
      $or: moves.map((m) => ({ therapistId: m.therapistId, date: m.date, time })),
    })
      .sort({ date: 1 })
      .populate('childId', 'name')
      .lean();

    if (conflicts.length > 0) {
      const first = conflicts[0];
      const childName = (first.childId as unknown as { name?: string } | null)?.name || 'pasien lain';
      const firstDate = new Date(first.date).toISOString().split('T')[0];
      const more = conflicts.length > 1 ? ` dan ${conflicts.length - 1} jadwal lain` : '';
      return NextResponse.json(
        {
          success: false,
          error: `Terapis sudah punya jadwal lain jam ${time} untuk ${childName} (${firstDate})${more}.`,
          code: 'SCHEDULE_CONFLICT',
          conflict: true,
          conflictCount: conflicts.length,
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }
  }

  await Session.bulkWrite(
    moves.map((m) => ({
      updateOne: { filter: { _id: m._id }, update: { $set: { date: m.date, time } } },
    }))
  );

  await WeeklySchedule.updateMany(
    { patientId, packageId: packageIdStr, day: oldDay as IWeeklySchedule['day'], hour: oldHour },
    { $set: { day: newDay as IWeeklySchedule['day'], hour: newHour } },
    { runValidators: true }
  );

  // Moving the series can change the package's last session date — keep
  // effectiveUntil / tokenExpiry honest, same as regeneratePackageSchedule does.
  const lastSession = await Session.findOne({
    packageId: session.packageId,
    isActive: true,
    sessionCategory: { $ne: 'extra' as const },
  }).sort({ date: -1 }).select('date').lean();
  if (lastSession) {
    const lastDate = lastSession.date;
    await WeeklySchedule.updateMany(
      { patientId, packageId: packageIdStr },
      { $set: { effectiveUntil: lastDate } }
    );
    await Child.findByIdAndUpdate(patientId, { tokenExpiry: lastDate });
  }

  return NextResponse.json({ success: true, data: { moved: moves.length } });
}

/**
 * Deduplicate: for each (day, hour, patientId), keep the slot with the largest effectiveFrom.
 */
function deduplicateSlots(slots: any[], weekStart: Date): any[] {
  const map = new Map<string, any>();
  for (const slot of slots) {
    const key = `${slot.day}_${slot.hour}_${slot.patientId}`;
    const slotDate = slot.effectiveFrom ? new Date(slot.effectiveFrom).getTime() : -Infinity;
    const existing = map.get(key);
    const existingDate = existing
      ? (existing.effectiveFrom ? new Date(existing.effectiveFrom).getTime() : -Infinity)
      : -Infinity;
    if (!existing || slotDate > existingDate) {
      map.set(key, slot);
    }
  }
  return [...map.values()];
}

/**
 * GET /api/weekly-schedule?weekStart=YYYY-MM-DD
 *
 * Returns:
 * 1. Active WeeklySchedule slots for the week (filtered by effectiveFrom / effectiveUntil),
 *    enriched with sessionProgress and sessionId for package-bound slots.
 * 2. Standalone Session records for the week that belong to a package but do NOT have a
 *    matching WeeklySchedule slot for the same patient/day/hour — these are manually-added
 *    sessions or sessions on a different day from the patient's regular slot.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const weekStart = getMondayOfWeek(params.get('weekStart') ?? undefined);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    // ── 1. Fetch WeeklySchedule slots ──

    const query: any = {
      $and: [
        {
          $or: [
            { effectiveFrom: null },
            { effectiveFrom: { $lte: weekStart } },
          ],
        },
        {
          $or: [
            { effectiveUntil: null },
            { effectiveUntil: { $gte: weekStart } },
          ],
        },
      ],
    };

    if (user.role === 'parent') {
      const children = await Child.find({
        parentId: new mongoose.Types.ObjectId(user.userId),
        isActive: true,
      }).select('_id').lean();
      const childIds = children.map((c: any) => c._id.toString());
      query.patientId = { $in: childIds };
    }

    const allSlots = await WeeklySchedule.find(query).lean();
    const activeSlots = deduplicateSlots(allSlots, weekStart);
    activeSlots.sort((a, b) => {
      const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
      const di = days.indexOf(a.day) - days.indexOf(b.day);
      return di !== 0 ? di : a.hour - b.hour;
    });

    // ── 2. Enrich package-bound slots with session progress ──

    const packageSlots = activeSlots.filter(s => s.packageId);

    // How many weeks ahead is the requested week vs the real current week?
    const currentMonday = getMondayOfWeek();
    const weeksAhead = Math.round(
      (weekStart.getTime() - currentMonday.getTime()) / (7 * 24 * 3600 * 1000)
    );

    if (packageSlots.length > 0) {
      const packageIds = packageSlots.map(s => new mongoose.Types.ObjectId(s.packageId));

      // Extra/susulan sessions (sessionCategory: 'extra') are additional make-up
      // sessions added mid-package — they must never perturb the regular
      // recurring slot's N/M counter, so every aggregation below excludes them.
      const regularOnly = { sessionCategory: { $ne: 'extra' as const } };

      const completedAgg = await Session.aggregate([
        { $match: { packageId: { $in: packageIds }, status: 'completed', isActive: true, ...regularOnly } },
        { $group: { _id: '$packageId', count: { $sum: 1 } } },
      ]);
      const completedMap = new Map<string, number>(
        completedAgg.map((r: any) => [r._id.toString(), r.count])
      );

      const weekSessions = await Session.find({
        packageId: { $in: packageIds },
        date: { $gte: weekStart, $lte: weekEnd },
        isActive: true,
        ...regularOnly,
      })
        .select('packageId sessionNumber totalSessions date time status _id')
        .lean();

      // Keyed by packageId+day+hour (not packageId alone) — two WeeklySchedule
      // slots can legitimately share a package (e.g. a patient scheduled twice a
      // week, or a susulan slot added mid-package), and each needs its own
      // matching Session document, not whichever one was inserted into the map last.
      const weekSessionMap = new Map<string, any>();
      // Packages that already have a session somewhere this week (any day/hour) —
      // used below to tell "not generated yet" apart from "this week's occurrence
      // was rescheduled to a different day/hour" for a slot with no direct match.
      const weekPackageIdsWithSession = new Set<string>();
      for (const ws of weekSessions) {
        const dayName = dateToDayName(new Date((ws as any).date));
        const hour = timeToHour((ws as any).time ?? '09:00');
        const pkgIdStr = (ws as any).packageId.toString();
        const key = `${pkgIdStr}_${dayName}_${hour}`;
        weekSessionMap.set(key, ws);
        weekPackageIdsWithSession.add(pkgIdStr);
      }

      // For slots without a session for this specific week, estimate the session number.
      // Past/current week: count sessions before weekStart + 1.
      // Future weeks: project from completed count + weeksAhead offset.
      const slotsNeedingEstimate = packageSlots.filter(
        s => !weekSessionMap.has(`${s.packageId.toString()}_${s.day}_${s.hour}`)
      );

      const countBeforeMap = new Map<string, number>();
      if (slotsNeedingEstimate.length > 0 && weeksAhead <= 0) {
        const estimatePkgIds = slotsNeedingEstimate.map(
          s => new mongoose.Types.ObjectId(s.packageId)
        );
        const countBeforeAgg = await Session.aggregate([
          { $match: { packageId: { $in: estimatePkgIds }, date: { $lt: weekStart }, isActive: true, ...regularOnly } },
          { $group: { _id: '$packageId', count: { $sum: 1 } } },
        ]);
        for (const row of countBeforeAgg) {
          countBeforeMap.set(row._id.toString(), row.count as number);
        }
      }

      const hiddenSlotIds = new Set<string>();

      for (const slot of activeSlots) {
        if (!slot.packageId) continue;
        const pkgIdStr  = slot.packageId.toString();
        const completed = completedMap.get(pkgIdStr) ?? 0;
        const total     = slot.totalSessions ?? 0;
        const weekSession = weekSessionMap.get(`${pkgIdStr}_${slot.day}_${slot.hour}`);

        // No session at this template's usual day/hour, but the package already
        // has one somewhere else this week — that means this week's occurrence
        // was rescheduled to a different slot (e.g. via drag-and-drop), not that
        // it simply hasn't been generated yet. Showing this slot would duplicate
        // the same occurrence at both its old and new position.
        if (!weekSession && weekPackageIdsWithSession.has(pkgIdStr)) {
          hiddenSlotIds.add(String(slot._id));
          continue;
        }

        let sessionNumber: number | null = weekSession?.sessionNumber ?? null;

        if (sessionNumber === null) {
          if (weeksAhead <= 0) {
            // Past or current week: derive from session count before weekStart
            const countBefore = countBeforeMap.get(pkgIdStr) ?? 0;
            sessionNumber = countBefore + 1;
          } else {
            // Future week: project forward from completed count
            sessionNumber = completed + weeksAhead + 1;
          }
        }

        // If projected session exceeds package total → slot is past its last session
        if (total > 0 && sessionNumber !== null && sessionNumber > total) {
          hiddenSlotIds.add(String(slot._id));
          continue;
        }
        // Also hide if already fully completed and this is a future week
        if (total > 0 && completed >= total && weeksAhead > 0) {
          hiddenSlotIds.add(String(slot._id));
          continue;
        }

        slot.sessionProgress = { completed, total, sessionNumber };
        slot.sessionId      = weekSession?._id?.toString() ?? null;
        slot.sessionStatus  = weekSession?.status ?? null;
      }

      // Remove slots that are past their last session
      const beforeFilter = activeSlots.length;
      activeSlots.splice(0, activeSlots.length,
        ...activeSlots.filter(s => !hiddenSlotIds.has(String(s._id)))
      );
      void beforeFilter; // suppress unused warning
    }

    // ── 3. Add standalone Session records for the week ──
    // These are package sessions that do NOT have a matching WeeklySchedule slot.
    // Typical case: manually added sessions for a different day/hour, or patients
    // without any recurring slot.

    // Build a set of (patientId, day, hour) covered by WeeklySchedule slots this week
    const coveredKeys = new Set<string>(
      activeSlots.map(s => `${s.patientId}_${s.day}_${s.hour}`)
    );

    const standaloneSessionQuery: any = {
      date: { $gte: weekStart, $lte: weekEnd },
      packageId: { $ne: null },
      isActive: true,
    };
    if (user.role === 'parent') {
      const childIds = (query.patientId as any)?.$in ?? [];
      standaloneSessionQuery.childId = { $in: childIds.map((id: any) => new mongoose.Types.ObjectId(id.toString())) };
    }

    const allWeekSessions = await Session.find(standaloneSessionQuery)
      .populate('childId', 'name')
      .populate('therapistId', 'name')
      .lean();

    // Also count completed per package for these sessions (may overlap with above)
    const standalonePackageIds = [
      ...new Set(allWeekSessions.map((s: any) => s.packageId?.toString()).filter(Boolean))
    ].map(id => new mongoose.Types.ObjectId(id));

    const standaloneCompletedAgg = standalonePackageIds.length > 0
      ? await Session.aggregate([
          { $match: { packageId: { $in: standalonePackageIds }, status: 'completed', isActive: true } },
          { $group: { _id: '$packageId', count: { $sum: 1 } } },
        ])
      : [];
    const standaloneCompletedMap = new Map<string, number>(
      standaloneCompletedAgg.map((r: any) => [r._id.toString(), r.count])
    );

    // Fetch therapyType for standalone sessions from their package transactions
    const packageTherapyTypeMap = new Map<string, string>();
    if (standalonePackageIds.length > 0) {
      const pkgTxs = await TokenTransaction.find(
        { _id: { $in: standalonePackageIds } }
      ).select('_id therapyType').lean();
      for (const tx of pkgTxs as any[]) {
        if (tx.therapyType) packageTherapyTypeMap.set(tx._id.toString(), tx.therapyType);
      }
    }

    const standaloneSlots: any[] = [];

    for (const session of allWeekSessions as any[]) {
      const dayName = dateToDayName(new Date(session.date));
      const hour = timeToHour(session.time);
      const patientId = session.childId?._id?.toString() ?? session.childId?.toString() ?? '';
      const key = `${patientId}_${dayName}_${hour}`;

      if (coveredKeys.has(key)) continue; // already covered by a WeeklySchedule slot

      const pkgIdStr = session.packageId?.toString() ?? '';
      const completed = standaloneCompletedMap.get(pkgIdStr) ?? 0;

      standaloneSlots.push({
        _id: session._id.toString(),
        _type: 'session',
        day: dayName,
        hour,
        patientId,
        patientName: session.childId?.name ?? '',
        therapistId: session.therapistId?._id?.toString() ?? session.therapistId?.toString() ?? '',
        therapistName: session.therapistId?.name ?? '',
        therapyType: packageTherapyTypeMap.get(pkgIdStr) ?? '',
        diagnosis: '',
        notes: session.notes ?? '',
        effectiveFrom: null,
        packageId: pkgIdStr,
        totalSessions: session.totalSessions,
        effectiveUntil: null,
        sessionProgress: {
          completed,
          total: session.totalSessions ?? 0,
          sessionNumber: session.sessionNumber ?? null,
        },
        sessionId: session._id.toString(),
        sessionStatus: session.status,
        sessionCategory: session.sessionCategory ?? 'regular',
      });
    }

    let combined = [...activeSlots, ...standaloneSlots];

    // Therapists see the whole clinic grid so they can coordinate, but the
    // clinical fields of a colleague's patient stay with that colleague.
    if (user.role === 'therapist') {
      combined = combined.map((slot: any) =>
        slot.therapistId?.toString() === user.userId ? slot : { ...slot, diagnosis: '', notes: '' }
      );
    }

    return NextResponse.json({ success: true, data: combined });
  })
);

/**
 * POST /api/weekly-schedule
 * Admin only: create or update a recurring slot with versioning.
 *
 * Body `{ action: 'moveRecurring', sessionId, date, time, force? }` instead
 * moves a dragged session and the rest of its weekly series — see
 * moveRecurringSeries. Returns 409 on a therapist double-booking unless `force`.
 */
export const POST = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        ErrorResponse.forbidden('Admin access required', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    if (body.action === 'moveRecurring') {
      return moveRecurringSeries(body);
    }
    const { _id, effectiveFrom: effectiveFromStr, ...data } = body;

    // Hero Bridge slots are schedule-only — no package/token requirement, no
    // auto-detection from TokenTransaction, and no package-linking below.
    const isHeroBridge = data.therapyType === 'HB';

    // Block slot creation if patient has no active package (tokenBalance = 0)
    if (data.patientId && !isHeroBridge) {
      const patient = await Child.findOne({ _id: data.patientId, isActive: true })
        .select('tokenBalance name')
        .lean();
      if (!patient) {
        return NextResponse.json(
          ErrorResponse.notFound('Pasien tidak ditemukan'),
          { status: 404 }
        );
      }
      if (((patient as any).tokenBalance ?? 0) <= 0) {
        return NextResponse.json(
          ErrorResponse.badRequest(
            `Pasien "${(patient as any).name}" belum memiliki paket aktif (token = 0). Assign paket terlebih dahulu di halaman detail pasien.`,
            'NO_TOKENS'
          ),
          { status: 400 }
        );
      }

      // Auto-set therapyType from the patient's most recent active package
      if (!data.therapyType) {
        const activeTx = await TokenTransaction.findOne({
          childId: new mongoose.Types.ObjectId(data.patientId),
          type: 'topup',
          packageType: { $ne: null },
        }).sort({ createdAt: -1 }).select('therapyType').lean();
        if (activeTx && (activeTx as any).therapyType) {
          data.therapyType = (activeTx as any).therapyType;
        }
      }
    }

    // Normalize therapyType: empty string → null so enum validator doesn't reject it
    if (data.therapyType !== 'OT' && data.therapyType !== 'TW' && data.therapyType !== 'HB') {
      data.therapyType = null;
    }

    const effectiveFrom = effectiveFromStr
      ? new Date(effectiveFromStr + 'T00:00:00Z')
      : getMondayOfWeek();

    if (mongoose.isValidObjectId(data.therapistId)) {
      const inactiveError = await getInactiveTherapistError(data.therapistId, effectiveFrom);
      if (inactiveError) {
        return NextResponse.json(ErrorResponse.badRequest(inactiveError), { status: 400 });
      }
    }

    // Hero Bridge is a one-off session, not a recurring weekly template — pin
    // effectiveUntil to the same week so it only appears on its single occurrence
    // instead of repeating every week like OT/TW slots.
    if (isHeroBridge) {
      data.effectiveUntil = effectiveFrom;
    }

    const existing = await WeeklySchedule.findOne({
      day: data.day,
      hour: data.hour,
      patientId: data.patientId,
      effectiveFrom,
    });

    let slot;
    if (existing) {
      slot = await WeeklySchedule.findByIdAndUpdate(
        existing._id,
        { $set: { ...data, effectiveFrom } },
        { new: true, runValidators: true }
      );
    } else {
      slot = await WeeklySchedule.create({ ...data, effectiveFrom });
    }

    // ── Link package + regenerate its schedule across all linked days ──
    // Skipped entirely for Hero Bridge — it has no package/token backing, so
    // linking here would incorrectly attach an unrelated OT/TW package to it.
    if (data.patientId && !isHeroBridge) {
      // Match by therapy type — a package's own therapyType is null only for
      // genuine 'both' packages (deliberately usable for either OT or TW), so
      // that's the only wildcard case. Without this filter, an OT slot could
      // silently latch onto the child's least-used package regardless of type
      // (including a TW-only or assessment package), which is a real bug this
      // fixes: package selection now can't cross therapy types.
      const requestedType = data.therapyType as 'OT' | 'TW' | null;
      const allPkgs = await TokenTransaction.find({
        childId: new mongoose.Types.ObjectId(data.patientId),
        type: 'topup',
        packageType: { $ne: null },
        $or: [{ therapyType: requestedType }, { therapyType: null }],
      }).sort({ createdAt: -1 });

      // Pick the newest matching package that still has remaining sessions
      // (count < amount). Extra/susulan sessions never count toward this —
      // only regular ones are generated through this path.
      const regularSessionFilter = { sessionCategory: { $ne: 'extra' as const } };

      let activePkg: typeof allPkgs[number] | null = null;
      for (const pkg of allPkgs) {
        const count = await Session.countDocuments({ packageId: pkg._id, isActive: true, ...regularSessionFilter });
        if (count < (pkg.amount as number)) {
          activePkg = pkg;
          break;
        }
      }
      // Fall back to most recent matching package if all are fully used
      if (!activePkg && allPkgs.length > 0) {
        activePkg = allPkgs[0];
      }

      if (activePkg && mongoose.isValidObjectId(data.therapistId)) {
        await WeeklySchedule.findByIdAndUpdate((slot as any)._id, {
          $set: {
            packageId: (activePkg._id as mongoose.Types.ObjectId).toString(),
            totalSessions: activePkg.amount,
          },
        });

        // Regenerates future sessions across every WeeklySchedule slot linked
        // to this package (including the one just created/updated above) —
        // this is what lets a package span multiple days per week.
        await regeneratePackageSchedule(data.patientId, activePkg._id as mongoose.Types.ObjectId);
      }
    }

    // Re-fetch the slot so the response reflects all updates (packageId, totalSessions, etc.)
    const updatedSlot = await WeeklySchedule.findById((slot as any)._id).lean();
    return NextResponse.json({ success: true, data: updatedSlot ?? slot });
  })
);

/**
 * DELETE /api/weekly-schedule?id=<slotId>
 * Admin only: remove a specific slot document by its _id.
 */
export const DELETE = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role !== 'admin' && user.role !== 'super_admin') {
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

    // If the removed slot was one of possibly several days sharing a
    // package, redistribute that package's remaining budget across whatever
    // days are still linked to it (or just clean up effectiveUntil if none are).
    if ((deleted as any).packageId && mongoose.isValidObjectId((deleted as any).packageId)) {
      await regeneratePackageSchedule(
        (deleted as any).patientId,
        new mongoose.Types.ObjectId((deleted as any).packageId)
      );
    }

    return NextResponse.json({ success: true });
  })
);
