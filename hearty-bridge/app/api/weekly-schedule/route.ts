import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import WeeklySchedule from '@/models/WeeklySchedule';
import Session from '@/models/Session';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';
import mongoose from 'mongoose';

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

const DAY_NAMES = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

function dateToDayName(date: Date): string {
  return DAY_NAMES[date.getUTCDay()];
}

function timeToHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
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
      for (const ws of weekSessions) {
        const dayName = dateToDayName(new Date((ws as any).date));
        const hour = timeToHour((ws as any).time ?? '09:00');
        const key = `${(ws as any).packageId.toString()}_${dayName}_${hour}`;
        weekSessionMap.set(key, ws);
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

    const combined = [...activeSlots, ...standaloneSlots];

    return NextResponse.json({ success: true, data: combined });
  })
);

/**
 * POST /api/weekly-schedule
 * Admin only: create or update a recurring slot with versioning.
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

    // ── Link package + auto-generate remaining sessions ──
    // Skipped entirely for Hero Bridge — it has no package/token backing, so
    // linking here would incorrectly attach an unrelated OT/TW package to it.
    if (data.patientId && !isHeroBridge) {
      const allPkgs = await TokenTransaction.find({
        childId: new mongoose.Types.ObjectId(data.patientId),
        type: 'topup',
        packageType: { $ne: null },
      }).sort({ createdAt: -1 });

      // Pick the newest package that still has remaining sessions (count < amount).
      // This means: if a package already has some sessions in the calendar (but not all),
      // we generate only the REMAINING sessions, not all over again.
      // Extra/susulan sessions never count against a package's regular remaining
      // count — only they're generated through this path.
      const regularSessionFilter = { sessionCategory: { $ne: 'extra' as const } };

      let activePkg: typeof allPkgs[number] | null = null;
      let existingSessionCount = 0;
      for (const pkg of allPkgs) {
        const count = await Session.countDocuments({ packageId: pkg._id, isActive: true, ...regularSessionFilter });
        if (count < (pkg.amount as number)) {
          activePkg = pkg;
          existingSessionCount = count;
          break;
        }
      }
      // Fall back to most recent package if all are fully used
      if (!activePkg && allPkgs.length > 0) {
        activePkg = allPkgs[0];
        existingSessionCount = await Session.countDocuments({ packageId: allPkgs[0]._id, isActive: true, ...regularSessionFilter });
      }

      if (activePkg) {
        const totalSessions: number = activePkg.amount;

        // Guard: if another active recurring slot for this patient is already
        // linked to this same package, don't regenerate/duplicate its sessions —
        // only that slot should own generation for the package. This is what
        // stops "tambah jadwal susulan" (adding a second weekly slot for a
        // package already in progress) from doubling up on session dates; use
        // the dedicated "+ Sesi Tambahan" action for susulan sessions instead.
        const otherActiveSlot = await WeeklySchedule.findOne({
          patientId: data.patientId,
          packageId: (activePkg._id as mongoose.Types.ObjectId).toString(),
          _id: { $ne: (slot as any)._id },
          $or: [{ effectiveUntil: null }, { effectiveUntil: { $gte: new Date() } }],
        }).lean();

        const remainingCount = otherActiveSlot ? 0 : Math.max(0, totalSessions - existingSessionCount);

        if (remainingCount > 0 && mongoose.isValidObjectId(data.therapistId)) {
          // Generate only the remaining sessions, starting from effectiveFrom on the target day.
          // Session numbers continue from where existing sessions left off.
          const DAY_TO_IDX: Record<string, number> = {
            senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
          };
          const targetDayIdx = DAY_TO_IDX[data.day as string] ?? 1;
          const firstDate = new Date(effectiveFrom);
          while (firstDate.getUTCDay() !== targetDayIdx) {
            firstDate.setUTCDate(firstDate.getUTCDate() + 1);
          }

          const startSessionNumber = existingSessionCount + 1;
          const sessionDates = Array.from({ length: remainingCount }, (_, i) => {
            const d = new Date(firstDate);
            d.setUTCDate(firstDate.getUTCDate() + i * 7);
            return d;
          });
          const lastSessionDate = sessionDates[sessionDates.length - 1];
          const therapistObjId = new mongoose.Types.ObjectId(data.therapistId);

          await Session.insertMany(
            sessionDates.map((d, idx) => ({
              childId: new mongoose.Types.ObjectId(data.patientId),
              therapistId: therapistObjId,
              date: d,
              time: `${String(data.hour).padStart(2, '0')}:00`,
              duration: 60,
              type: 'in-person',
              status: 'scheduled',
              packageId: activePkg._id,
              sessionNumber: startSessionNumber + idx,
              totalSessions,
              isActive: true,
            }))
          );

          await WeeklySchedule.findByIdAndUpdate((slot as any)._id, {
            $set: {
              packageId: (activePkg._id as mongoose.Types.ObjectId).toString(),
              totalSessions,
              effectiveUntil: lastSessionDate,
            },
          });

          await Child.findByIdAndUpdate(data.patientId, { tokenExpiry: lastSessionDate });
        } else {
          // All sessions already generated — just link this slot to the package
          await WeeklySchedule.findByIdAndUpdate((slot as any)._id, {
            $set: {
              packageId: (activePkg._id as mongoose.Types.ObjectId).toString(),
              totalSessions,
            },
          });
        }
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

    return NextResponse.json({ success: true });
  })
);
