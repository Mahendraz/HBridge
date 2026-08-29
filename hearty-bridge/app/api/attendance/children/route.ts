import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Session from '@/models/Session';
import WeeklySchedule from '@/models/WeeklySchedule';

/**
 * GET /api/attendance/children
 * "Absensi Anak" — per-session attendance list (nama anak / jenis terapi /
 * terapis / status) for a single day. Distinct domain from the staff
 * clock-in/out attendance the rest of /api/attendance covers — this reads
 * from Session, not Attendance. Admin/super_admin see everyone; therapist
 * sees only their own sessions.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (!['admin', 'super_admin', 'therapist'].includes(user.role)) {
      return ErrorResponse.forbidden();
    }

    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const dateStr = params.get('date');
    const dayStart = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const query: any = { date: { $gte: dayStart, $lte: dayEnd }, isActive: true };
    if (user.role === 'therapist') query.therapistId = user.userId;

    const sessions = await Session.find(query)
      .populate('childId', 'name')
      .populate('therapistId', 'name')
      .populate('packageId', 'therapyType')
      .sort({ time: 1 })
      .lean();

    // Fallback jenis terapi for sessions without a package (e.g. standalone/Hero
    // Bridge sessions) — look up the recurring WeeklySchedule slot for the same
    // child+therapist pair.
    const childIds = Array.from(
      new Set(sessions.map((s: any) => s.childId?._id?.toString()).filter(Boolean))
    );
    const fallbackMap = new Map<string, string>();
    if (childIds.length > 0) {
      const slots = await WeeklySchedule.find({ patientId: { $in: childIds } })
        .select('patientId therapistId therapyType')
        .lean();
      for (const slot of slots as any[]) {
        const key = `${slot.patientId}_${slot.therapistId}`;
        if (!fallbackMap.has(key) && slot.therapyType) fallbackMap.set(key, slot.therapyType);
      }
    }

    const records = sessions.map((s: any) => {
      const childId = s.childId?._id?.toString() ?? '';
      const therapistId = s.therapistId?._id?.toString() ?? '';
      return {
        id: s._id.toString(),
        childName: s.childId?.name ?? 'Tidak diketahui',
        therapistName: s.therapistId?.name ?? 'Tidak diketahui',
        therapyType: s.packageId?.therapyType ?? fallbackMap.get(`${childId}_${therapistId}`) ?? null,
        time: s.time,
        status: s.status,
      };
    });

    return SuccessResponse.ok({
      date: dateStr ?? dayStart.toISOString().split('T')[0],
      records,
    });
  })
);
