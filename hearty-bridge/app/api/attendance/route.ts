import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import mongoose from 'mongoose';

/** Return today's date in WIB as 'YYYY-MM-DD' */
function todayWIB(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split('T')[0];
}

/**
 * GET /api/attendance
 * Query params:
 *   date    – YYYY-MM-DD (default: today WIB)
 *   history – 'true' to get own last 30 days
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (!['admin', 'super_admin', 'therapist'].includes(user.role)) {
      return ErrorResponse.forbidden('Anda tidak memiliki akses absensi');
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date') || todayWIB();
    const wantHistory = url.searchParams.get('history') === 'true';

    // If history=true, return own attendance history (last 30 days)
    if (wantHistory) {
      const history = await Attendance.find({
        userId: new mongoose.Types.ObjectId(user.userId),
      })
        .sort({ date: -1 })
        .limit(30)
        .lean();

      return NextResponse.json({
        success: true,
        data: { history },
      });
    }

    // Return all staff attendance for the given date
    const [records, allStaff] = await Promise.all([
      Attendance.find({ date: dateParam }).sort({ checkInAt: 1 }).lean(),
      User.find({ role: { $in: ['admin', 'therapist'] }, isActive: true })
        .select('_id name role')
        .lean(),
    ]);

    // Build a map of checked-in user IDs
    const checkedInIds = new Set(records.map((r) => r.userId.toString()));

    // Absent = staff without an attendance record
    const absentStaff = allStaff
      .filter((s) => !checkedInIds.has((s._id as mongoose.Types.ObjectId).toString()))
      .map((s) => ({
        userId: s._id,
        userName: s.name,
        userRole: s.role,
        date: dateParam,
        status: 'absent' as const,
      }));

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        records,
        absent: absentStaff,
        summary: {
          onTime: records.filter((r) => r.status === 'on-time').length,
          late:   records.filter((r) => r.status === 'late').length,
          absent: absentStaff.length,
        },
      },
    });
  })
);
