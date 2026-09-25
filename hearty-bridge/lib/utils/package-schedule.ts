import mongoose from 'mongoose';
import WeeklySchedule from '@/models/WeeklySchedule';
import Session from '@/models/Session';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';

// Moved out of app/api/weekly-schedule/route.ts so other routes (invoice edit,
// ADM-2) can regenerate a package's sessions too — route files may only export
// HTTP handlers.

const DAY_NAMES = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

export function dateToDayName(date: Date): string {
  return DAY_NAMES[date.getUTCDay()];
}

export const DAY_TO_IDX: Record<string, number> = {
  senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6,
};

/** Earliest date on/after `from` that falls on the given ISO weekday index (0=Sun..6=Sat). */
export function nextOccurrenceOf(from: Date, weekdayIdx: number): Date {
  const d = new Date(from);
  while (d.getUTCDay() !== weekdayIdx) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/**
 * Regenerate the future ('scheduled') Session documents for a package across
 * ALL WeeklySchedule slots currently linked to it, so one package can span
 * multiple days per week (e.g. Senin + Rabu = 2x/minggu) sharing a single
 * session-count budget instead of each slot claiming the whole thing for
 * itself (the old behavior — only the first slot ever got real sessions,
 * every other slot for the same package silently got none).
 *
 * Completed/no-show/cancelled sessions are historical and left untouched;
 * only 'scheduled' (not-yet-happened) ones are safe to delete and recreate.
 * New sessions are interleaved across the linked days in chronological
 * order — a 2x/week package alternates Senin/Rabu/Senin/Rabu... — rather
 * than exhausting one day's occurrences before touching the other.
 *
 * Call this after linking/unlinking any WeeklySchedule slot to a package
 * (create, edit, or delete a slot that belongs to a multi-day package).
 */
export async function regeneratePackageSchedule(
  patientId: string,
  packageId: mongoose.Types.ObjectId
): Promise<void> {
  const pkg = await TokenTransaction.findById(packageId).lean();
  if (!pkg) return;
  const total: number = (pkg as any).amount ?? 0;

  const linkedSlots = await WeeklySchedule.find({
    patientId,
    packageId: packageId.toString(),
  }).lean();

  // Multiple raw WeeklySchedule documents can exist for the same real-world
  // day (this app versions slot edits by effectiveFrom) — collapse to one
  // per day, keeping the most recent version, same convention as the GET
  // handler's deduplicateSlots. Without this, two docs both meaning "Selasa"
  // would be treated as two different linked days and double-book Tuesdays.
  const byDay = new Map<string, any>();
  for (const s of linkedSlots as any[]) {
    if (!mongoose.isValidObjectId(s.therapistId)) continue;
    const existing = byDay.get(s.day);
    const ef = s.effectiveFrom ? new Date(s.effectiveFrom).getTime() : -Infinity;
    const existingEf = existing?.effectiveFrom ? new Date(existing.effectiveFrom).getTime() : -Infinity;
    if (!existing || ef > existingEf) byDay.set(s.day, s);
  }
  const validSlots = [...byDay.values()];

  const existingSessions = await Session.find({
    packageId,
    isActive: true,
    sessionCategory: { $ne: 'extra' as const },
  }).lean();
  const immutable = existingSessions.filter((s: any) => s.status !== 'scheduled');
  const scheduled = existingSessions.filter((s: any) => s.status === 'scheduled');

  // Single linked day (the common case, unchanged from before this feature)
  // — nothing to interleave, so leave already-correct future dates alone on
  // every unrelated save; only clear sessions whose day is no longer linked.
  // Two+ linked days always fully recompute the 'scheduled' pool, because the
  // whole point is redistributing sessions that may have been front-loaded
  // onto just one day before a second day joined the group. This is a no-op
  // in practice unless the linked day-set or "today" actually changed.
  let kept: any[];
  let toDelete: any[];
  if (validSlots.length <= 1) {
    const linkedDaySet = new Set(validSlots.map((s: any) => s.day));
    kept = scheduled.filter((s: any) => linkedDaySet.has(dateToDayName(new Date(s.date))));
    toDelete = scheduled.filter((s: any) => !linkedDaySet.has(dateToDayName(new Date(s.date))));
  } else {
    kept = [];
    toDelete = scheduled;
  }

  if (toDelete.length > 0) {
    await Session.deleteMany({ _id: { $in: toDelete.map((s: any) => s._id) } });
  }

  // Renumber `kept` scheduled sessions contiguously right after the immutable
  // ones, in date order. Their sessionNumber can otherwise be left with gaps
  // (e.g. 3,5,7,9,11 from a since-removed 2nd day) even though the document
  // count is still correct — historical (immutable) sessions keep whichever
  // number they actually completed under; only the still-pending ones move.
  kept.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  for (let i = 0; i < kept.length; i++) {
    const newNumber = immutable.length + i + 1;
    if (kept[i].sessionNumber !== newNumber || kept[i].totalSessions !== total) {
      await Session.updateOne({ _id: kept[i]._id }, { $set: { sessionNumber: newNumber, totalSessions: total } });
      kept[i].sessionNumber = newNumber;
    }
  }

  const keptAll = [...immutable, ...kept];
  const remaining = Math.max(0, total - keptAll.length);
  const maxKeptNumber = keptAll.reduce((max: number, s: any) => Math.max(max, s.sessionNumber ?? 0), 0);
  const maxKeptDate: Date | null = keptAll.length > 0
    ? keptAll.reduce((max: Date, s: any) => (s.date > max ? s.date : max), keptAll[0].date)
    : null;

  if (validSlots.length === 0 || remaining === 0) {
    // Either no slot left to attach future sessions to (all deleted), or the
    // package is already fully accounted for — just keep effectiveUntil honest.
    await WeeklySchedule.updateMany(
      { patientId, packageId: packageId.toString() },
      { $set: { totalSessions: total, effectiveUntil: maxKeptDate } }
    );
    if (maxKeptDate) await Child.findByIdAndUpdate(patientId, { tokenExpiry: maxKeptDate });
    return;
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const minEffectiveFrom = validSlots.reduce((min: Date | null, s: any) => {
    if (!s.effectiveFrom) return min;
    const ef = new Date(s.effectiveFrom);
    return !min || ef < min ? ef : min;
  }, null as Date | null);
  const startRef = minEffectiveFrom && minEffectiveFrom > today ? minEffectiveFrom : today;

  // Each linked day resumes the week after whatever it most recently already
  // has (kept sessions), or starts fresh from startRef if it has none yet —
  // this is what lets a newly-added day slot in without colliding with dates
  // the other day already owns.
  const latestByDay = new Map<string, Date>();
  for (const s of keptAll as any[]) {
    const day = dateToDayName(new Date(s.date));
    const prev = latestByDay.get(day);
    if (!prev || s.date > prev) latestByDay.set(day, new Date(s.date));
  }

  const candidates = validSlots.map((s: any) => {
    const last = latestByDay.get(s.day);
    let next: Date;
    if (last) {
      next = new Date(last);
      next.setUTCDate(next.getUTCDate() + 7);
      if (next < startRef) next = nextOccurrenceOf(startRef, DAY_TO_IDX[s.day] ?? 1);
    } else {
      next = nextOccurrenceOf(startRef, DAY_TO_IDX[s.day] ?? 1);
    }
    return { slot: s, next };
  });

  let nextNumber = maxKeptNumber + 1;
  const newDocs: any[] = [];
  let count = remaining;
  while (count > 0) {
    candidates.sort((a, b) => a.next.getTime() - b.next.getTime());
    const c = candidates[0];
    newDocs.push({
      childId: new mongoose.Types.ObjectId(patientId),
      therapistId: new mongoose.Types.ObjectId(c.slot.therapistId),
      date: new Date(c.next),
      time: `${String(c.slot.hour).padStart(2, '0')}:00`,
      duration: 60,
      type: 'in-person',
      status: 'scheduled',
      packageId,
      sessionNumber: nextNumber,
      totalSessions: total,
      isActive: true,
    });
    nextNumber++;
    count--;
    c.next = new Date(c.next);
    c.next.setUTCDate(c.next.getUTCDate() + 7);
  }

  if (newDocs.length > 0) {
    await Session.insertMany(newDocs);
  }

  const lastDate: Date = newDocs.length > 0
    ? newDocs.reduce((max, d) => (d.date > max ? d.date : max), newDocs[0].date)
    : (maxKeptDate as Date);

  await WeeklySchedule.updateMany(
    { patientId, packageId: packageId.toString() },
    { $set: { totalSessions: total, effectiveUntil: lastDate } }
  );
  await Child.findByIdAndUpdate(patientId, { tokenExpiry: lastDate });
}
