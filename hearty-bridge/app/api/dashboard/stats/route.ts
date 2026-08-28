import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { User, Child, Report, Invoice } from '@/models';
import Session from '@/models/Session';
import WeeklySchedule from '@/models/WeeklySchedule';
import { JWTPayload } from '@/lib/utils/jwt';
import mongoose from 'mongoose';

// ── helpers ───────────────────────────────────────────────────────────────────

const DAY_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const DAY_MAP: Record<number, string> = {
  1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu',
};

const DOW_OF_DAY: Record<string, number> = { senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6 };

// Days-from-today (0 = today) until the next real-calendar occurrence of `day`.
// Uses actual weekday numbers (0-6, Sun-Sat) rather than DAY_ORDER's array index,
// since DAY_ORDER skips Sunday and an index-based mod-6 offset undercounts by one
// whenever the projection window crosses a Sunday.
function daysUntil(day: string, todayDow: number): number {
  return ((DOW_OF_DAY[day] ?? 0) - todayDow + 7) % 7;
}

function getTodayName(): string {
  return DAY_MAP[new Date().getDay()] ?? '';
}

function getDateRanges() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const day = now.getDay();
  const toMon = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + toMon);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 5);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfToday, endOfToday, startOfWeek, endOfWeek };
}

function toOid(id: string | null | undefined): mongoose.Types.ObjectId | null {
  if (!id) return null;
  try { return new mongoose.Types.ObjectId(id); } catch { return null; }
}

/**
 * Returns a map from packageId (hex string) → number of completed sessions.
 * Uses aggregate count instead of Session.sessionNumber, which is optional
 * and often unreliable. totalSessions always comes from WeeklySchedule.
 */
async function buildCompletedCountByPackage(slots: any[]): Promise<Map<string, number>> {
  const packageOids = slots
    .filter(s => s.packageId)
    .map(s => toOid(s.packageId))
    .filter(Boolean) as mongoose.Types.ObjectId[];

  if (packageOids.length === 0) return new Map();

  const rows = await Session.aggregate([
    { $match: { packageId: { $in: packageOids }, status: 'completed' } },
    { $group: { _id: '$packageId', count: { $sum: 1 } } },
  ]);

  const map = new Map<string, number>();
  for (const row of rows) {
    map.set((row._id as mongoose.Types.ObjectId).toString(), row.count as number);
  }
  return map;
}

async function buildTodayAppointments(todaySlots: any[], completedMap: Map<string, number>) {
  if (todaySlots.length === 0) return [];

  const patientOids = todaySlots
    .map(s => toOid(s.patientId))
    .filter(Boolean) as mongoose.Types.ObjectId[];

  if (patientOids.length === 0) return [];

  const children = await Child.find({ _id: { $in: patientOids } })
    .populate<{ parentId: { name: string; phone?: string } }>('parentId', 'name phone')
    .lean();

  const childMap = new Map(children.map(c => [c._id.toString(), c]));

  return todaySlots
    .sort((a, b) => a.hour - b.hour)
    .map(slot => {
      const child  = childMap.get(slot.patientId);
      const parent = (child?.parentId as { name: string; phone?: string }) ?? null;
      const completed = slot.packageId ? (completedMap.get(slot.packageId) ?? 0) : 0;
      return {
        patientName:   slot.patientName,
        parentPhone:   parent?.phone ?? '—',
        therapistName: slot.therapistName,
        therapyType:   slot.therapyType,
        hour:          slot.hour,
        sessionNumber: completed,
        totalSessions: slot.totalSessions ?? 0,
      };
    });
}

// ── admin ─────────────────────────────────────────────────────────────────────

async function adminStats(_user: JWTPayload): Promise<NextResponse> {
  const todayName = getTodayName();
  const { startOfToday, endOfToday, startOfWeek, endOfWeek } = getDateRanges();

  const [
    activePatients,
    therapyTodayScheduled,
    therapyTodayCompleted,
    therapyWeekPlanned,
    therapyWeekCompleted,
    todaySlots,
  ] = await Promise.all([
    Child.countDocuments({ isActive: true }),
    WeeklySchedule.countDocuments({ day: todayName } as any),
    Session.countDocuments({ date: { $gte: startOfToday, $lte: endOfToday }, status: 'completed' }),
    WeeklySchedule.countDocuments(),
    Session.countDocuments({ date: { $gte: startOfWeek, $lte: endOfWeek }, status: 'completed' }),
    WeeklySchedule.find({ day: todayName } as any).lean(),
  ]);

  const completedMap  = await buildCompletedCountByPackage(todaySlots as any[]);
  const todaySchedule = await buildTodayAppointments(todaySlots as any[], completedMap);

  return SuccessResponse.ok({
    data: {
      role: 'admin',
      activePatients,
      therapyToday:    { completed: therapyTodayCompleted, scheduled: therapyTodayScheduled },
      therapyThisWeek: { completed: therapyWeekCompleted,  planned:   therapyWeekPlanned },
      todaySchedule,
    },
  });
}

// ── super_admin ───────────────────────────────────────────────────────────────

async function superAdminStats(_user: JWTPayload): Promise<NextResponse> {
  const todayName = getTodayName();
  const { startOfToday, endOfToday, startOfWeek, endOfWeek } = getDateRanges();

  const [
    activePatients,
    therapyTodayScheduled,
    therapyTodayCompleted,
    therapyWeekPlanned,
    therapyWeekCompleted,
    todaySlots,
    totalRevenueAgg,
    pendingInvoices,
    recentSessions,
    recentReports,
    recentUsers,
    recentInvoices,
  ] = await Promise.all([
    Child.countDocuments({ isActive: true }),
    WeeklySchedule.countDocuments({ day: todayName } as any),
    Session.countDocuments({ date: { $gte: startOfToday, $lte: endOfToday }, status: 'completed' }),
    WeeklySchedule.countDocuments(),
    Session.countDocuments({ date: { $gte: startOfWeek, $lte: endOfWeek }, status: 'completed' }),
    WeeklySchedule.find({ day: todayName } as any).lean(),
    Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Invoice.countDocuments({ status: 'unpaid' }),
    Session.find({ status: 'completed' })
      .sort({ updatedAt: -1 }).limit(10)
      .populate('childId', 'name')
      .populate('therapistId', 'name')
      .select('childId therapistId type sessionNumber totalSessions updatedAt')
      .lean(),
    Report.find({ isActive: true })
      .sort({ createdAt: -1 }).limit(10)
      .select('title childName therapistName type status createdAt')
      .lean(),
    User.find({ isActive: true })
      .sort({ createdAt: -1 }).limit(10)
      .select('name role createdAt')
      .lean(),
    Invoice.find({ status: 'paid' })
      .sort({ paidAt: -1 }).limit(10)
      .select('childName amount paidAt packageType')
      .lean(),
  ]);

  const completedMap  = await buildCompletedCountByPackage(todaySlots as any[]);
  const todaySchedule = await buildTodayAppointments(todaySlots as any[], completedMap);
  const totalRevenue  = ((totalRevenueAgg as any[])[0]?.total ?? 0) as number;

  const recentActivity = [
    ...(recentSessions as any[]).map(s => ({
      id:          String(s._id),
      type:        'session_completed' as const,
      title:       `Sesi selesai — ${s.childId?.name ?? ''}`,
      description: `Terapis: ${s.therapistId?.name ?? '—'} · Pertemuan ${s.sessionNumber ?? '?'}/${s.totalSessions ?? '?'} · ${s.type ?? ''}`,
      actor:       s.therapistId?.name ?? '—',
      timestamp:   s.updatedAt,
    })),
    ...(recentReports as any[]).map(r => ({
      id:          String(r._id),
      type:        'report_created' as const,
      title:       `Laporan dibuat — ${r.childName}`,
      description: `${r.title} · ${r.type} · ${r.status}`,
      actor:       r.therapistName ?? '—',
      timestamp:   r.createdAt,
    })),
    ...(recentUsers as any[]).map(u => ({
      id:          String(u._id),
      type:        'user_registered' as const,
      title:       `${u.role === 'therapist' ? 'Terapis' : u.role === 'parent' ? 'Orang tua' : 'Admin'} baru terdaftar`,
      description: u.name,
      actor:       u.name,
      timestamp:   u.createdAt,
    })),
    ...(recentInvoices as any[]).map(i => ({
      id:          String(i._id),
      type:        'invoice_paid' as const,
      title:       `Invoice lunas — ${i.childName}`,
      description: `${i.packageType} · Rp ${new Intl.NumberFormat('id-ID').format(i.amount)}`,
      actor:       '—',
      timestamp:   i.paidAt,
    })),
  ]
    .filter(a => a.timestamp)
    .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime())
    .slice(0, 20);

  return SuccessResponse.ok({
    data: {
      role: 'super_admin',
      activePatients,
      therapyToday:     { completed: therapyTodayCompleted, scheduled: therapyTodayScheduled },
      therapyThisWeek:  { completed: therapyWeekCompleted,  planned:   therapyWeekPlanned },
      todaySchedule,
      financialSummary: { totalRevenue, pendingInvoices },
      recentActivity,
    },
  });
}

// ── therapist ─────────────────────────────────────────────────────────────────

async function therapistStats(user: JWTPayload): Promise<NextResponse> {
  const todayName = getTodayName();
  const { startOfToday, endOfToday, startOfWeek, endOfWeek } = getDateRanges();
  const therapistOid = toOid(user.userId);

  if (!therapistOid) return ErrorResponse.badRequest('Invalid user ID');

  const [mySlots, sessionTodayCompleted, sessionWeekCompleted] = await Promise.all([
    WeeklySchedule.find({ therapistId: user.userId }).lean(),
    Session.countDocuments({ therapistId: therapistOid, date: { $gte: startOfToday, $lte: endOfToday }, status: 'completed' }),
    Session.countDocuments({ therapistId: therapistOid, date: { $gte: startOfWeek, $lte: endOfWeek }, status: 'completed' }),
  ]);

  const todayRawSlots = (mySlots as any[])
    .filter(s => s.day === todayName)
    .sort((a, b) => a.hour - b.hour);

  // Count completed sessions per package
  const completedMap = await buildCompletedCountByPackage(mySlots as any[]);

  const todaySchedule = todayRawSlots.map((s: any) => ({
    patientName:   s.patientName,
    therapyType:   s.therapyType,
    hour:          s.hour,
    sessionNumber: s.packageId ? (completedMap.get(s.packageId) ?? 0) : 0,
    totalSessions: s.totalSessions ?? 0,
  }));

  const weeklySchedule: Record<string, any[]> = {};
  for (const day of DAY_ORDER) {
    weeklySchedule[day] = (mySlots as any[])
      .filter(s => s.day === day)
      .sort((a, b) => a.hour - b.hour)
      .map(s => ({
        patientName:   s.patientName,
        therapyType:   s.therapyType,
        hour:          s.hour,
        sessionNumber: s.packageId ? (completedMap.get(s.packageId) ?? 0) : 0,
        totalSessions: s.totalSessions ?? 0,
      }));
  }

  // Build missing-reports list: per slot, past sessions only (slotDate <= today)
  // Helper: local YYYY-MM-DD string (avoids UTC-shift on WIB servers)
  const localDateStr = (d: Date): string => {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dd}`;
  };

  const todayStr = localDateStr(new Date());

  const uniquePatientIds = [...new Set(
    (mySlots as any[]).filter(s => s.patientId && DAY_ORDER.includes(s.day)).map(s => s.patientId as string)
  )];
  const patientOids2 = uniquePatientIds.map(id => toOid(id)).filter(Boolean) as mongoose.Types.ObjectId[];

  let missingReports: Array<{
    childId: string;
    childName: string;
    therapyType: string;
    day: string;
    slotDate: string;
    hour: number;
    sessionNumber: number;
    totalSessions: number;
  }> = [];

  if (patientOids2.length > 0) {
    const N_WEEKS = 5; // current week + 4 previous weeks
    const lookbackStart = new Date(startOfWeek);
    lookbackStart.setDate(startOfWeek.getDate() - (N_WEEKS - 1) * 7);

    const recentReports = await Report.find({
      therapistId: therapistOid,
      childId:     { $in: patientOids2 },
      isActive:    true,
      createdAt:   { $gte: lookbackStart },
    }).select('childId sessionDate createdAt').lean();

    // A slot is covered if a report matches by sessionDate OR by local createdAt date
    const coveredKeys = new Set<string>();
    for (const r of recentReports as any[]) {
      const cid = r.childId.toString();
      if (r.sessionDate) {
        coveredKeys.add(`${cid}_${localDateStr(new Date(r.sessionDate))}`);
      }
      if (r.createdAt) {
        coveredKeys.add(`${cid}_${localDateStr(new Date(r.createdAt))}`);
      }
    }

    // Generate slot instances for every week in the lookback window
    const validSlots = (mySlots as any[]).filter(s => s.patientId && DAY_ORDER.includes(s.day));
    const allInstances: Array<typeof validSlots[number] & { slotDateStr: string }> = [];

    for (let w = 0; w < N_WEEKS; w++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(startOfWeek.getDate() - w * 7);

      for (const s of validSlots) {
        const offset   = DAY_ORDER.indexOf(s.day);
        const slotDate = new Date(weekStart);
        slotDate.setDate(weekStart.getDate() + offset);
        const slotDateStr = localDateStr(slotDate);
        // Only past sessions (≤ today), never future
        if (slotDateStr <= todayStr) {
          allInstances.push({ ...s, slotDateStr });
        }
      }
    }

    missingReports = allInstances
      .filter(s => !coveredKeys.has(`${s.patientId}_${s.slotDateStr}`))
      .sort((a, b) =>
        b.slotDateStr < a.slotDateStr ? -1 : b.slotDateStr > a.slotDateStr ? 1 : a.hour - b.hour
      )
      .map(s => ({
        childId:       s.patientId as string,
        childName:     s.patientName ?? '',
        therapyType:   s.therapyType ?? '',
        day:           s.day ?? '',
        slotDate:      s.slotDateStr,
        hour:          s.hour ?? 0,
        sessionNumber: s.packageId ? (completedMap.get(s.packageId) ?? 0) : 0,
        totalSessions: s.totalSessions ?? 0,
      }));
  }

  return SuccessResponse.ok({
    data: {
      role:            'therapist',
      sessionToday:    { completed: sessionTodayCompleted,      planned: todayRawSlots.length },
      sessionThisWeek: { completed: sessionWeekCompleted,       planned: (mySlots as any[]).length },
      todaySchedule,
      weeklySchedule,
      missingReports,
    },
  });
}

// ── parent ────────────────────────────────────────────────────────────────────

async function parentStats(user: JWTPayload): Promise<NextResponse> {
  const parentOid  = toOid(user.userId);
  const { startOfWeek, endOfWeek } = getDateRanges();

  if (!parentOid) return ErrorResponse.badRequest('Invalid user ID');

  const children = await Child.find({ parentId: parentOid, isActive: true })
    .select('_id name')
    .lean();

  if (children.length === 0) {
    return SuccessResponse.ok({ data: { role: 'parent', children: [], weeklyReports: [], upcomingSchedule: [], unseenInvoiceCount: 0 } });
  }

  const childIds       = children.map(c => c._id as mongoose.Types.ObjectId);
  const childStringIds = children.map(c => c._id.toString());

  const [allSlots, weeklyReportsRaw, unseenInvoiceCount] = await Promise.all([
    WeeklySchedule.find({ patientId: { $in: childStringIds } }).lean(),
    Report.find({
      childId: { $in: childIds },
      isActive: true,
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    }).sort({ createdAt: -1 })
      .select('childName title type status createdAt')
      .lean(),
    Invoice.countDocuments({
      childId: { $in: childIds },
      isVisibleToParent: true,
      seenByParentAt: null,
    }),
  ]);

  const completedMap = await buildCompletedCountByPackage(allSlots as any[]);

  const childNameMap = new Map(children.map(c => [c._id.toString(), c.name]));
  const today        = new Date();
  const todayDow     = today.getDay();

  const upcomingSchedule = (allSlots as any[])
    .sort((a, b) => {
      const ai = daysUntil(a.day, todayDow);
      const bi = daysUntil(b.day, todayDow);
      return ai !== bi ? ai - bi : a.hour - b.hour;
    })
    .map(slot => {
      const offset   = daysUntil(slot.day, todayDow);
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + offset);
      const date = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, '0')}-${String(slotDate.getDate()).padStart(2, '0')}`;

      return {
        childName:     childNameMap.get(slot.patientId) ?? slot.patientName,
        day:           slot.day,
        date,
        hour:          slot.hour,
        therapistName: slot.therapistName,
        therapyType:   slot.therapyType,
        sessionNumber: slot.packageId ? (completedMap.get(slot.packageId) ?? 0) : 0,
        totalSessions: slot.totalSessions ?? 0,
      };
    });

  const weeklyReports = (weeklyReportsRaw as any[]).map(r => ({
    id:        r._id.toString(),
    childName: r.childName,
    title:     r.title,
    type:      r.type,
    status:    r.status,
    createdAt: r.createdAt,
  }));

  return SuccessResponse.ok({
    data: {
      role: 'parent',
      children:        children.map(c => ({ childId: c._id.toString(), childName: c.name })),
      weeklyReports,
      upcomingSchedule,
      unseenInvoiceCount,
    },
  });
}

// ── route export ──────────────────────────────────────────────────────────────

export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: JWTPayload) => {
    await connectToDatabase();
    switch (user.role) {
      case 'admin':       return adminStats(user);
      case 'super_admin': return superAdminStats(user);
      case 'therapist':   return therapistStats(user);
      case 'parent':      return parentStats(user);
      default:            return ErrorResponse.forbidden('Akses ditolak');
    }
  })
);
