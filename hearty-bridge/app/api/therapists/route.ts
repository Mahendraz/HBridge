import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import WeeklySchedule from '@/models/WeeklySchedule';
import TherapistLeave from '@/models/TherapistLeave';
import { withAnyAuth } from '@/lib/middleware/auth';
import {
  withErrorHandling,
  ErrorResponse,
  SuccessResponse,
  logRequest
} from '@/lib/utils/error-handler';

export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  logRequest('GET', '/api/therapists');

  // Only admin can view all therapists, others can only view assigned ones
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'therapist') {
    return ErrorResponse.forbidden("Access denied.");
  }

  try {
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.log('MongoDB connection failed, using mock data for demo:', dbError instanceof Error ? dbError.message : String(dbError));
      // Continue with fallback mock data when DB connection fails
    }

    // Get all therapist users
    let therapists: any[] = [];
    try {
      const query: any = { role: 'therapist' };
      // admin/super_admin see all (including inactive); therapist sees only active
      if (user.role === 'therapist') query.isActive = true;
      therapists = await User.find(query).select('-password').lean();
    } catch (dbQueryError) {
      console.log('Database query failed, using mock data:', dbQueryError instanceof Error ? dbQueryError.message : String(dbQueryError));
      therapists = [];
    }
    
    // If no therapists found in database, use mock data for demo
    if (therapists.length === 0) {
      console.log('No therapists found in database, using mock data for demo');
      therapists = [
        {
          _id: 'mock_therapist_1',
          name: 'Dr. Sari Wulandari, M.Psi',
          email: 'sari.wulandari@heartybridge.com',
          phone: '+6281234567890',
          role: 'therapist',
          isActive: true,
          profile: {
            specialization: ['Autisme', 'Terapi Perilaku ABA', 'Konseling Keluarga'],
            clinic: 'Hearty Bridge Center Jakarta',
            experience: 8
          },
          createdAt: new Date('2024-01-15')
        },
        {
          _id: 'mock_therapist_2',
          name: 'Budi Santoso, S.ST',
          email: 'budi.santoso@heartybridge.com',
          phone: '+6281234567891',
          role: 'therapist',
          isActive: true,
          profile: {
            specialization: ['Terapi Wicara', 'Keterlambatan Bicara'],
            clinic: 'Hearty Bridge Center Jakarta',
            experience: 6
          },
          createdAt: new Date('2024-02-20')
        },
        {
          _id: 'mock_therapist_3',
          name: 'Linda Maharani, S.Tr.OT',
          email: 'linda.maharani@heartybridge.com',
          phone: '+6281234567892',
          role: 'therapist',
          isActive: true,
          profile: {
            specialization: ['Terapi Okupasi', 'Integrasi Sensori'],
            clinic: 'Hearty Bridge Center Jakarta',
            experience: 5
          },
          createdAt: new Date('2024-03-10')
        },
        {
          _id: 'mock_therapist_4',
          name: 'Dr. Andi Permana, M.Psi',
          email: 'andi.permana@heartybridge.com',
          phone: '+6281234567893',
          role: 'therapist',
          isActive: true,
          profile: {
            specialization: ['ADHD', 'Terapi Kognitif'],
            clinic: 'Hearty Bridge Center Jakarta',
            experience: 10
          },
          createdAt: new Date('2024-01-25')
        }
      ];
    }

    // Count unique patients per therapist from weekly schedule
    const scheduleSlots = await WeeklySchedule.find({}).select('therapistId patientId').lean().catch(() => []);
    const patientsByTherapist = new Map<string, Set<string>>();
    for (const slot of scheduleSlots) {
      const tid = String(slot.therapistId);
      if (!patientsByTherapist.has(tid)) patientsByTherapist.set(tid, new Set());
      patientsByTherapist.get(tid)!.add(String(slot.patientId));
    }

    // Build leave map: therapistId → leave type ('cuti' | 'inactive') for today
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const activeLeaves = await TherapistLeave.find({
      status: 'active',
      startDate: { $lte: new Date() },
      $or: [{ endDate: null }, { endDate: { $gte: todayMidnight } }],
    }).select('userId type').lean().catch(() => []);
    const leaveMap = new Map<string, string>();
    for (const lv of activeLeaves as any[]) {
      leaveMap.set(lv.userId.toString(), lv.type as string);
    }

    const detectTherapyType = (specializations: string[]): 'OT' | 'TW' | null => {
      const text = specializations.join(' ').toLowerCase();
      if (text.includes('wicara') || text.includes(' tw') || text.startsWith('tw') || text === 'tw') return 'TW';
      if (text.includes('okupasi') || text.includes(' ot') || text.startsWith('ot') || text === 'ot') return 'OT';
      return null;
    };

    const therapistsWithStats = therapists.map((therapist) => {
        const tid = String(therapist._id);
        const assignedPatients = patientsByTherapist.get(tid)?.size ?? 0;
        const specializations = Array.isArray(therapist.profile?.specialization)
          ? therapist.profile.specialization
          : therapist.profile?.specialization
            ? [therapist.profile.specialization]
            : [];

        const leaveType = leaveMap.get(tid);
        const status = leaveType === 'cuti'
          ? 'on-leave'
          : leaveType === 'inactive'
          ? 'inactive'
          : therapist.isActive ? 'active' : 'inactive';

        return {
          _id: therapist._id,
          name: therapist.name,
          email: therapist.email,
          phone: therapist.phone || '+1-555-0000',
          specializations: specializations.length > 0 ? specializations : ['General Therapy'],
          therapyType: detectTherapyType(specializations),
          status,
          currentLeave: leaveType ?? null,
          assignedPatients: assignedPatients,
          maxPatients: 20,
          rating: 4.8,
          totalSessions: 342,
          joiningDate: therapist.createdAt?.toISOString() || new Date().toISOString(),
          availability: {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            hours: { start: '09:00', end: '17:00' }
          },
          credentials: specializations.length > 0 ? specializations : ['Licensed Therapist'],
          clinic: therapist.profile?.clinic || 'Hearty Bridge Center',
          experience: therapist.profile?.experience || 5
        };
      });

    // If user is therapist, only return their own data
    const filteredTherapists = user.role === 'therapist' 
      ? therapistsWithStats.filter(t => t._id.toString() === user.userId)
      : therapistsWithStats;

    return SuccessResponse.ok({
      therapists: filteredTherapists,
      total: filteredTherapists.length,
      active: filteredTherapists.filter(t => t.status === 'active').length,
      avgCaseload: Math.round(
        filteredTherapists.reduce((acc, t) => acc + t.assignedPatients, 0) / 
        (filteredTherapists.length || 1)
      ),
      avgRating: (
        filteredTherapists.reduce((acc, t) => acc + t.rating, 0) / 
        (filteredTherapists.length || 1)
      ).toFixed(1)
    }, 'Therapists retrieved successfully');

  } catch (error) {
    console.error('Error fetching therapists:', error);
    return ErrorResponse.internalServerError('Failed to fetch therapists');
  }
});