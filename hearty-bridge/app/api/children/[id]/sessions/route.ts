import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Session from '@/models/Session';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';
import WeeklySchedule from '@/models/WeeklySchedule';
import mongoose from 'mongoose';

const DAY_NAMES: Record<number, string> = {
  0: 'minggu', 1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu',
};

/**
 * GET /api/children/[id]/sessions
 * Get session data for a specific child
 */
export const GET = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const childId = url.pathname.split('/')[3]; // Extract child ID from path
    const { searchParams } = url;
    const status = searchParams.get('status'); // upcoming, completed, all
    const packageIdFilter = searchParams.get('packageId');

    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return ErrorResponse.badRequest('Invalid child ID', 'VALIDATION_ERROR');
    }

    await connectToDatabase();

    try {
      // Check if child exists and user has access
      const child = await Child.findOne({ _id: childId, isActive: true });
      if (!child) {
        return ErrorResponse.notFound('Child not found', 'RESOURCE_NOT_FOUND');
      }

      // Check access permissions (therapist can view all children)
      if (user.role === 'parent' && child.parentId.toString() !== user.userId) {
        return ErrorResponse.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
      }

      // Get sessions based on filter
      let sessions;
      if (packageIdFilter && mongoose.Types.ObjectId.isValid(packageIdFilter)) {
        sessions = await Session.find({
          childId: new mongoose.Types.ObjectId(childId),
          packageId: new mongoose.Types.ObjectId(packageIdFilter),
          isActive: true,
        })
          .populate('therapistId', 'name email profile.specialization')
          .sort({ sessionNumber: 1 });
      } else if (status === 'upcoming') {
        sessions = await Session.findUpcomingSessions(new mongoose.Types.ObjectId(childId));
      } else if (status === 'completed') {
        sessions = await Session.findCompletedSessions(new mongoose.Types.ObjectId(childId));
      } else {
        sessions = await Session.findByChild(new mongoose.Types.ObjectId(childId));
      }

      // Calculate session statistics
      const allSessions = await Session.findByChild(new mongoose.Types.ObjectId(childId));
      const totalSessions = allSessions.length;
      const attendedSessions = allSessions.filter(s => s.status === 'completed').length;
      const upcomingSessions = allSessions.filter(s => s.status === 'scheduled' && s.date >= new Date()).length;

      // Format response
      const formattedSessions = sessions.map(session => ({
        id: session._id,
        date: session.date.toISOString().split('T')[0],
        time: session.time,
        duration: session.duration,
        therapist: session.therapistId ?
          (session.therapistId as any).name || 'Therapist' : 'No therapist assigned',
        type: session.type,
        status: session.status,
        rating: session.rating,
        notes: session.notes,
        goals: session.goals || [],
        nextSteps: session.nextSteps,
        packageId: session.packageId,
        sessionNumber: session.sessionNumber,
        totalSessions: session.totalSessions,
      }));

      return SuccessResponse.ok(
        { 
          sessions: formattedSessions,
          childId: childId,
          childName: child.name,
          totalSessions,
          attendedSessions,
          upcomingSessions
        },
        'Sessions retrieved successfully'
      );

    } catch (error) {
      console.error(`Error fetching sessions for child ${childId}:`, error);
      throw error;
    }
  })
);

/**
 * POST /api/children/[id]/sessions
 * Create sessions. Therapists can create individual sessions; admins can also
 * use packageMode=true to schedule all N sessions for an active package.
 *
 * packageMode body: { packageMode: true, date: 'YYYY-MM-DD', hour: number }
 * normal body:      { date, time, therapistId?, duration?, type?, goals?, notes? }
 */
export const POST = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const childId = url.pathname.split('/')[3];

    if (user.role !== 'therapist' && user.role !== 'admin' && user.role !== 'super_admin') {
      return ErrorResponse.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
    }

    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return ErrorResponse.badRequest('Invalid child ID', 'VALIDATION_ERROR');
    }

    await connectToDatabase();

    const body = await request.json();

    const child = await Child.findById(childId);
    if (!child) {
      return ErrorResponse.notFound('Child not found', 'RESOURCE_NOT_FOUND');
    }

    if (user.role === 'therapist' && child.therapistId && child.therapistId.toString() !== user.userId) {
      return ErrorResponse.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
    }

    // ── Package mode: schedule all N sessions at once ──
    if ((user.role === 'admin' || user.role === 'super_admin') && body.packageMode) {
      const { date, hour, therapistId: bodyTherapistId } = body as { date: string; hour: number; therapistId?: string };

      if (!date || typeof hour !== 'number') {
        return NextResponse.json(
          ErrorResponse.badRequest('date dan hour diperlukan', 'VALIDATION_ERROR'),
          { status: 400 }
        );
      }

      const startDate = new Date(date + 'T00:00:00Z');
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          ErrorResponse.badRequest('Format tanggal tidak valid', 'VALIDATION_ERROR'),
          { status: 400 }
        );
      }

      // Guard: child must have token balance remaining
      if ((child.tokenBalance ?? 0) <= 0) {
        return NextResponse.json(
          ErrorResponse.badRequest(
            'Saldo token pasien sudah habis (0). Assign paket baru terlebih dahulu di halaman detail pasien.',
            'NO_TOKENS'
          ),
          { status: 400 }
        );
      }

      // Find the most recent active package for this child
      const packageTx = await TokenTransaction.findOne({
        childId: new mongoose.Types.ObjectId(childId),
        type: 'topup',
        packageType: { $ne: null },
      }).sort({ createdAt: -1 });

      if (!packageTx) {
        return NextResponse.json(
          ErrorResponse.badRequest(
            'Pasien tidak memiliki paket aktif. Assign paket terlebih dahulu di halaman detail pasien.',
            'NO_PACKAGE'
          ),
          { status: 400 }
        );
      }

      // Block if sessions already exist for this package
      const existingCount = await Session.countDocuments({
        packageId: packageTx._id,
        isActive: true,
      });

      if (existingCount > 0) {
        return NextResponse.json(
          ErrorResponse.badRequest(
            'Sesi untuk paket ini sudah dijadwalkan. Gunakan fitur reschedule untuk mengubah tanggal.',
            'SESSIONS_EXIST'
          ),
          { status: 400 }
        );
      }

      const totalSessions: number = packageTx.amount;
      const therapistId = (bodyTherapistId && mongoose.isValidObjectId(bodyTherapistId))
        ? new mongoose.Types.ObjectId(bodyTherapistId)
        : (child.therapistId || new mongoose.Types.ObjectId(user.userId));

      // Build session dates: startDate + 0, 7, 14, … days
      const sessionDates = Array.from({ length: totalSessions }, (_, i) => {
        const d = new Date(startDate);
        d.setUTCDate(startDate.getUTCDate() + i * 7);
        return d;
      });

      const lastSessionDate = sessionDates[sessionDates.length - 1];

      const sessionDocs = sessionDates.map((d, idx) => ({
        childId: new mongoose.Types.ObjectId(childId),
        therapistId,
        date: d,
        time: `${String(hour).padStart(2, '0')}:00`,
        duration: 60,
        type: 'in-person' as const,
        status: 'scheduled' as const,
        packageId: packageTx._id,
        sessionNumber: idx + 1,
        totalSessions,
        isActive: true,
      }));

      await Session.insertMany(sessionDocs);

      // Update matching WeeklySchedule slot if it exists (same patient + day + hour)
      const dayName = DAY_NAMES[startDate.getUTCDay()] as 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu';
      const matchingSlot = await WeeklySchedule.findOne({
        patientId: childId,
        day: dayName,
        hour,
      }).sort({ effectiveFrom: -1 });

      if (matchingSlot) {
        await WeeklySchedule.findByIdAndUpdate(matchingSlot._id, {
          $set: {
            packageId: (packageTx._id as mongoose.Types.ObjectId).toString(),
            totalSessions,
            effectiveUntil: lastSessionDate,
          },
        });
      }

      child.tokenExpiry = lastSessionDate;
      await child.save();

      return SuccessResponse.created(
        {
          sessionsCreated: totalSessions,
          firstSession: sessionDates[0],
          lastSession: lastSessionDate,
          packageId: (packageTx._id as mongoose.Types.ObjectId).toString(),
          totalSessions,
        },
        `${totalSessions} sesi berhasil dijadwalkan`
      );
    }

    // ── Normal single session creation (therapist or admin) ──
    const sessionData = {
      childId: new mongoose.Types.ObjectId(childId),
      therapistId: body.therapistId
        ? new mongoose.Types.ObjectId(body.therapistId)
        : (child.therapistId || new mongoose.Types.ObjectId(user.userId)),
      date: new Date(body.date),
      time: body.time,
      duration: body.duration || 60,
      type: body.type || 'in-person',
      status: body.status || 'scheduled',
      goals: body.goals || [],
      notes: body.notes,
      location: body.location,
      meetingUrl: body.meetingUrl,
    };

    const session = new Session(sessionData);
    await session.save();

    return SuccessResponse.created({ session }, 'Session created successfully');
  })
);

/**
 * Handle unsupported HTTP methods
 */
export async function PUT() {
  return ErrorResponse.methodNotAllowed(['GET', 'POST']);
}

export async function DELETE() {
  return ErrorResponse.methodNotAllowed(['GET', 'POST']);
}

export async function PATCH() {
  return ErrorResponse.methodNotAllowed(['GET', 'POST']);
}