import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import { User, Child, Report, Invoice } from '@/models';
import Session from '@/models/Session';
import WeeklySchedule from '@/models/WeeklySchedule';
import TokenTransaction from '@/models/TokenTransaction';
import { JWTPayload } from '@/lib/utils/jwt';
import mongoose from 'mongoose';
import { getSessionBalances } from '@/lib/utils/session-balance';

// ── helpers ───────────────────────────────────────────────────────────────────

const DAY_ORDER = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

// Parent dashboard "Jadwal Hari Ini & Mendatang" window, in days (incl. today).
const UPCOMING_DAYS = 7;

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

function timeToHour(time: string): number {
  return parseInt((time || '09:00').split(':')[0], 10);
}

const DAY_NAME_BY_UTC_DOW = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

/**
 * Builds a schedule from actual Session documents (the ground truth for what's
 * really happening), not from the WeeklySchedule recurring template. A slot's
 * template day/hour goes stale the moment its session for a given week is
 * rescheduled (drag-and-drop), cancelled, or manually added — so deriving the
 * schedule from WeeklySchedule shows the wrong (or missing) appointments.
 * Session.date is authoritative after any such change.
 */
async function buildAppointments(opts: {
  from: Date;
  to: Date;
  therapistOid?: mongoose.Types.ObjectId;
  childOids?: mongoose.Types.ObjectId[];
}) {
  const query: any = {
    date: { $gte: opts.from, $lte: opts.to },
    isActive: true,
    status: { $ne: 'cancelled' },
  };
  if (opts.therapistOid) query.therapistId = opts.therapistOid;
  if (opts.childOids) query.childId = { $in: opts.childOids };

  const sessions = await Session.find(query)
    .populate<{ childId: { _id: mongoose.Types.ObjectId; name: string; parentId: { name: string; phone?: string } | null } }>({
      path: 'childId',
      select: 'name parentId',
      populate: { path: 'parentId', select: 'name phone' },
    })
    .populate<{ therapistId: { name: string } }>('therapistId', 'name')
    .lean();

  if (sessions.length === 0) return [];

  const packageIds = [...new Set(
    sessions.map((s: any) => s.packageId?.toString()).filter(Boolean)
  )] as string[];
  const packageOids = packageIds.map(id => new mongoose.Types.ObjectId(id));

  // Therapy type comes from the session's package. An "OT & TW" package has no
  // single type (therapyType null), so fall back to the weekly slot the session
  // was generated from — matched by package + weekday, else any slot of it.
  const therapyTypeMap = new Map<string, string>();
  const slotTypeMap    = new Map<string, string>();
  if (packageOids.length > 0) {
    const [pkgs, pkgSlots] = await Promise.all([
      TokenTransaction.find({ _id: { $in: packageOids } }).select('_id therapyType').lean(),
      WeeklySchedule.find({ packageId: { $in: packageIds }, therapyType: { $ne: null } })
        .select('packageId day therapyType').lean(),
    ]);
    for (const pkg of pkgs as any[]) {
      if (pkg.therapyType) therapyTypeMap.set(pkg._id.toString(), pkg.therapyType);
    }
    for (const slot of pkgSlots as any[]) {
      slotTypeMap.set(`${slot.packageId}_${slot.day}`, slot.therapyType);
      if (!slotTypeMap.has(slot.packageId)) slotTypeMap.set(slot.packageId, slot.therapyType);
    }
  }

  return (sessions as any[])
    .map(s => {
      const child  = s.childId;
      const parent = child?.parentId ?? null;
      const date   = new Date(s.date);
      const day    = DAY_NAME_BY_UTC_DOW[date.getUTCDay()];
      const pkgId  = s.packageId?.toString() ?? '';
      const therapyType = pkgId
        ? (therapyTypeMap.get(pkgId) ?? slotTypeMap.get(`${pkgId}_${day}`) ?? slotTypeMap.get(pkgId) ?? '')
        : '';
      return {
        childId:       child?._id?.toString() ?? '',
        patientName:   child?.name ?? '',
        parentPhone:   parent?.phone ?? '—',
        therapistName: s.therapistId?.name ?? '',
        therapyType,
        // Session.date is stored at UTC midnight of the session's calendar day.
        date:          date.toISOString().slice(0, 10),
        day,
        hour:          timeToHour(s.time),
        sessionNumber: s.sessionNumber ?? 0,
        totalSessions: s.totalSessions ?? 0,
      };
    })
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? -1 : 1) : a.hour - b.hour));
}

async function buildTodayAppointments(therapistOid?: mongoose.Types.ObjectId) {
  const { startOfToday, endOfToday } = getDateRanges();
  const appointments = await buildAppointments({ from: startOfToday, to: endOfToday, therapistOid });
  return appointments.map(a => ({
    patientName:   a.patientName,
    parentPhone:   a.parentPhone,
    therapistName: a.therapistName,
    therapyType:   a.therapyType,
    hour:          a.hour,
    sessionNumber: a.sessionNumber,
    totalSessions: a.totalSessions,
  }));
}

// ── admin ─────────────────────────────────────────────────────────────────────

async function adminStats(_user: JWTPayload): Promise<NextResponse> {
  const { startOfToday, endOfToday, startOfWeek, endOfWeek } = getDateRanges();

  const [
    activePatients,
    therapyTodayScheduled,
    therapyTodayCompleted,
    therapyWeekPlanned,
    therapyWeekCompleted,
    todaySchedule,
  ] = await Promise.all([
    Child.countDocuments({ isActive: true }),
    Session.countDocuments({ date: { $gte: startOfToday, $lte: endOfToday }, isActive: true, status: { $ne: 'cancelled' } }),
    Session.countDocuments({ date: { $gte: startOfToday, $lte: endOfToday }, status: 'completed' }),
    WeeklySchedule.countDocuments(),
    Session.countDocuments({ date: { $gte: startOfWeek, $lte: endOfWeek }, status: 'completed' }),
    buildTodayAppointments(),
  ]);

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
  const { startOfToday, endOfToday, startOfWeek, endOfWeek } = getDateRanges();

  const [
    activePatients,
    therapyTodayScheduled,
    therapyTodayCompleted,
    therapyWeekPlanned,
    therapyWeekCompleted,
    todaySchedule,
    totalRevenueAgg,
    pendingInvoices,
    recentSessions,
    recentReports,
    recentUsers,
    recentInvoices,
  ] = await Promise.all([
    Child.countDocuments({ isActive: true }),
    Session.countDocuments({ date: { $gte: startOfToday, $lte: endOfToday }, isActive: true, status: { $ne: 'cancelled' } }),
    Session.countDocuments({ date: { $gte: startOfToday, $lte: endOfToday }, status: 'completed' }),
    WeeklySchedule.countDocuments(),
    Session.countDocuments({ date: { $gte: startOfWeek, $lte: endOfWeek }, status: 'completed' }),
    buildTodayAppointments(),
    Invoice.aggregate([{ $match: { status: 'paid', isActive: { $ne: false } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Invoice.countDocuments({ status: 'unpaid', isActive: { $ne: false } }),
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
    Invoice.find({ status: 'paid', isActive: { $ne: false } })
      .sort({ paidAt: -1 }).limit(10)
      .select('childName amount paidAt packageType')
      .lean(),
  ]);

  const totalRevenue = ((totalRevenueAgg as any[])[0]?.total ?? 0) as number;

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
  const { startOfToday, endOfToday, startOfWeek, endOfWeek } = getDateRanges();
  const therapistOid = toOid(user.userId);

  if (!therapistOid) return ErrorResponse.badRequest('Invalid user ID');

  const [mySlots, sessionTodayCompleted, sessionWeekCompleted, todaySchedule] = await Promise.all([
    WeeklySchedule.find({ therapistId: user.userId }).lean(),
    Session.countDocuments({ therapistId: therapistOid, date: { $gte: startOfToday, $lte: endOfToday }, status: 'completed' }),
    Session.countDocuments({ therapistId: therapistOid, date: { $gte: startOfWeek, $lte: endOfWeek }, status: 'completed' }),
    buildTodayAppointments(therapistOid),
  ]);

  // Count completed sessions per package (for the weekly-template view below)
  const completedMap = await buildCompletedCountByPackage(mySlots as any[]);

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
      sessionToday:    { completed: sessionTodayCompleted,      planned: todaySchedule.length },
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
    return SuccessResponse.ok({ data: { role: 'parent', children: [], weeklyReports: [], upcomingSchedule: [], unpaidInvoices: [], sessionBalances: [] } });
  }

  const childIds = children.map(c => c._id as mongoose.Types.ObjectId);

  // "Hari ini & mendatang" = today through the next 6 days.
  const { startOfToday } = getDateRanges();
  const endOfWindow = new Date(startOfToday);
  endOfWindow.setDate(startOfToday.getDate() + UPCOMING_DAYS - 1);
  endOfWindow.setHours(23, 59, 59, 999);

  const [balanceMap, appointments, weeklyReportsRaw, unpaidInvoicesRaw] = await Promise.all([
    getSessionBalances(childIds),
    buildAppointments({ from: startOfToday, to: endOfWindow, childOids: childIds }),
    Report.find({
      childId: { $in: childIds },
      isActive: true,
      status: 'completed',
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
    }).sort({ createdAt: -1 })
      .select('childName title type status createdAt')
      .lean(),
    // Unpaid invoices for the dashboard pop-up (ORT-7) — shown on every visit
    // until paid, not just until seen.
    Invoice.find({
      childId: { $in: childIds },
      isVisibleToParent: true,
      status: { $ne: 'paid' },
      isActive: { $ne: false },
    }).sort({ dueDate: 1 })
      .select('invoiceNumber childName packageType amount dueDate status')
      .lean(),
  ]);

  const now = new Date();
  const unpaidInvoices = (unpaidInvoicesRaw as any[]).map(inv => ({
    id:            inv._id.toString(),
    invoiceNumber: inv.invoiceNumber,
    childName:     inv.childName,
    packageType:   inv.packageType,
    amount:        inv.amount,
    dueDate:       inv.dueDate,
    status:        inv.status === 'overdue' || new Date(inv.dueDate) < now ? 'overdue' : 'unpaid',
  }));

  // Sisa Sesi Anda: one entry per child, broken down per program (OT / TW).
  // Negative remaining = sessions already run on a package not yet paid.
  const sessionBalances = children.map(c => {
    const b = balanceMap.get(c._id.toString());
    return {
      childId:   c._id.toString(),
      childName: c.name,
      remaining: b?.remaining ?? 0,
      hasUnpaid: b?.hasUnpaid ?? false,
      programs:  (b?.programs ?? []).map(p => ({
        therapyType: p.therapyType,
        label:       p.label,
        remaining:   p.remaining,
        used:        p.used,
        total:       p.total,
        hasUnpaid:   p.hasUnpaid,
      })),
    };
  });

  const upcomingSchedule = appointments.map(a => ({
    childId:       a.childId,
    childName:     a.patientName,
    day:           a.day,
    date:          a.date,
    hour:          a.hour,
    therapistName: a.therapistName,
    therapyType:   a.therapyType,
    sessionNumber: a.sessionNumber,
    totalSessions: a.totalSessions,
  }));

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
      unpaidInvoices,
      sessionBalances,
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
