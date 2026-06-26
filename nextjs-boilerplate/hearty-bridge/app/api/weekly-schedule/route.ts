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

    if (packageSlots.length > 0) {
      const packageIds = packageSlots.map(s => new mongoose.Types.ObjectId(s.packageId));

      const completedAgg = await Session.aggregate([
        { $match: { packageId: { $in: packageIds }, status: 'completed', isActive: true } },
        { $group: { _id: '$packageId', count: { $sum: 1 } } },
      ]);
      const completedMap = new Map<string, number>(
        completedAgg.map((r: any) => [r._id.toString(), r.count])
      );

      const weekSessions = await Session.find({
        packageId: { $in: packageIds },
        date: { $gte: weekStart, $lte: weekEnd },
        isActive: true,
      })
        .select('packageId sessionNumber totalSessions date status _id')
        .lean();

      const weekSessionMap = new Map<string, any>();
      for (const ws of weekSessions) {
        weekSessionMap.set((ws as any).packageId.toString(), ws);
      }

      for (const slot of activeSlots) {
        if (!slot.packageId) continue;
        const pkgIdStr = slot.packageId.toString();
        const completed = completedMap.get(pkgIdStr) ?? 0;
        const weekSession = weekSessionMap.get(pkgIdStr);

        slot.sessionProgress = {
          completed,
          total: slot.totalSessions ?? 0,
          sessionNumber: weekSession?.sessionNumber ?? null,
        };
        slot.sessionId = weekSession?._id?.toString() ?? null;
        slot.sessionStatus = weekSession?.status ?? null;
      }
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
    if (user.role !== 'admin') {
      return NextResponse.json(
        ErrorResponse.forbidden('Admin access required', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const { _id, effectiveFrom: effectiveFromStr, ...data } = body;

    // Block slot creation if patient has no active package (tokenBalance = 0)
    if (data.patientId) {
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

    const effectiveFrom = effectiveFromStr
      ? new Date(effectiveFromStr + 'T00:00:00Z')
      : getMondayOfWeek();

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

    // ── Auto-generate sessions if patient has active package with no sessions yet ──
    if (data.patientId && mongoose.isValidObjectId(data.therapistId)) {
      const activePkg = await TokenTransaction.findOne({
        childId: new mongoose.Types.ObjectId(data.patientId),
        type: 'topup',
        packageType: { $ne: null },
      }).sort({ createdAt: -1 });

      if (activePkg) {
        const existingSessionCount = await Session.countDocuments({
          packageId: activePkg._id,
          isActive: true,
        });

        if (existingSessionCount === 0) {
          // Compute first session date: next occurrence of slot.day from effectiveFrom
          const DAY_TO_IDX: Record<string, number> = {
            senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
          };
          const targetDayIdx = DAY_TO_IDX[data.day as string] ?? 1;
          const firstDate = new Date(effectiveFrom);
          while (firstDate.getUTCDay() !== targetDayIdx) {
            firstDate.setUTCDate(firstDate.getUTCDate() + 1);
          }

          const totalSessions: number = activePkg.amount;
          const sessionDates = Array.from({ length: totalSessions }, (_, i) => {
            const d = new Date(firstDate);
            d.setUTCDate(firstDate.getUTCDate() + i * 7);
            return d;
          });
          const lastSessionDate = sessionDates[totalSessions - 1];
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
              sessionNumber: idx + 1,
              totalSessions,
              isActive: true,
            }))
          );

          // Link packageId + effectiveUntil to the slot
          await WeeklySchedule.findByIdAndUpdate((slot as any)._id, {
            $set: {
              packageId: (activePkg._id as mongoose.Types.ObjectId).toString(),
              totalSessions,
              effectiveUntil: lastSessionDate,
            },
          });

          // Update child token expiry
          await Child.findByIdAndUpdate(data.patientId, { tokenExpiry: lastSessionDate });
        }
      }
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
