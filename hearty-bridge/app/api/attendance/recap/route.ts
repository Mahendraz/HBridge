import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';

/** Return today's date in WIB as 'YYYY-MM-DD' */
function todayWIB(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split('T')[0];
}

/** First/last day of the current WIB month, as 'YYYY-MM-DD' */
function currentMonthRange(): { from: string; to: string } {
  const today = todayWIB();
  const [y, m] = today.split('-').map(Number);
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

/** Count Mon-Sat days (the clinic's working days) between two 'YYYY-MM-DD' strings, inclusive. */
function countWorkingDays(from: string, to: string): number {
  const start = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  let count = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 0) count++; // exclude Sunday
  }
  return count;
}

/**
 * GET /api/attendance/recap?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Admin/therapist only. Aggregates attendance per staff member over a date range
 * in a single query (rather than one request per day), for the monthly/multi-month
 * recap view.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (!['admin', 'super_admin', 'therapist'].includes(user.role)) {
      return ErrorResponse.forbidden('Anda tidak memiliki akses absensi');
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const defaults = currentMonthRange();
    const from = url.searchParams.get('from') || defaults.from;
    const to = url.searchParams.get('to') || defaults.to;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
      return ErrorResponse.badRequest('Rentang tanggal tidak valid');
    }

    const [staff, records] = await Promise.all([
      User.find({ role: { $in: ['admin', 'therapist'] }, isActive: true })
        .select('_id name role')
        .lean(),
      Attendance.find({ date: { $gte: from, $lte: to } })
        .select('userId date status')
        .lean(),
    ]);

    const today = todayWIB();
    const elapsedTo = to < today ? to : today; // don't count future days as "should have attended"
    const workingDays = elapsedTo < from ? 0 : countWorkingDays(from, elapsedTo);

    const byUser = new Map<string, { onTime: number; late: number }>();
    for (const r of records as any[]) {
      const key = r.userId.toString();
      const entry = byUser.get(key) ?? { onTime: 0, late: 0 };
      if (r.status === 'on-time') entry.onTime++;
      else if (r.status === 'late') entry.late++;
      byUser.set(key, entry);
    }

    const rows = (staff as any[]).map((s) => {
      const entry = byUser.get(s._id.toString()) ?? { onTime: 0, late: 0 };
      const present = entry.onTime + entry.late;
      const absent = Math.max(0, workingDays - present);
      const attendanceRate = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;
      return {
        userId: s._id.toString(),
        userName: s.name,
        userRole: s.role,
        onTime: entry.onTime,
        late: entry.late,
        absent,
        attendanceRate,
      };
    });

    return NextResponse.json({
      success: true,
      data: { from, to, workingDays, rows },
    });
  })
);
