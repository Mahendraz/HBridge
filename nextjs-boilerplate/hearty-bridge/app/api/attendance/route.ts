import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
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
 *   history – 'true' to get own last 30 days (non-admin only)
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role === 'parent') {
      return ErrorResponse.forbidden('Orang tua tidak memiliki absensi');
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date') || todayWIB();
    const wantHistory = url.searchParams.get('history') === 'true';

    if (user.role === 'admin') {
      // Admin: fetch all attendance for the given date + all staff list
      const [records, allStaff] = await Promise.all([
        Attendance.find({ date: dateParam }).sort({ checkInAt: 1 }).lean(),
        User.find({ role: { $in: ['admin', 'therapist'] }, isActive: true })
          .select('_id name role')
          .lean(),
      ]);

      // Build a map of checked-in user IDs
      const checkedInIds = new Set(records.map((r) => r.userId.toString()));

      // Merge: absent = staff without an attendance record
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
    }

    // Non-admin: own record(s)
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

    // Today's status for the current user
    const record = await Attendance.findOne({
      userId: new mongoose.Types.ObjectId(user.userId),
      date: dateParam,
    }).lean();

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        record: record || null,
        myStatus: record ? record.status : 'absent',
      },
    });
  })
);
