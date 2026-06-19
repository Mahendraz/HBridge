import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Session from '@/models/Session';
import Child from '@/models/Child';
import mongoose from 'mongoose';

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

      // Check access permissions
      if (user.role === 'parent' && child.parentId.toString() !== user.userId) {
        return ErrorResponse.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
      }
      if (user.role === 'therapist' && (!child.therapistId || child.therapistId.toString() !== user.userId)) {
        return ErrorResponse.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
      }

      // Get sessions based on filter
      let sessions;
      if (status === 'upcoming') {
        sessions = await Session.findUpcomingSessions(new mongoose.Types.ObjectId(childId));
      } else if (status === 'completed') {
        sessions = await Session.findCompletedSessions(new mongoose.Types.ObjectId(childId));
      } else {
        sessions = await Session.findByChild(new mongoose.Types.ObjectId(childId));
      }

      // If no sessions exist, create some sample data for new children
      if (sessions.length === 0 && child.therapistId) {
        const sampleSessions = [
          {
            childId: new mongoose.Types.ObjectId(childId),
            therapistId: child.therapistId,
            date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            time: '3:00 PM',
            duration: 60,
            type: 'in-person',
            status: 'scheduled',
            goals: ['Initial assessment', 'Build rapport']
          },
          {
            childId: new mongoose.Types.ObjectId(childId),
            therapistId: child.therapistId,
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            time: '3:00 PM',
            duration: 60,
            type: 'in-person',
            status: 'scheduled',
            goals: ['Continue assessment', 'Set therapy goals']
          }
        ];

        sessions = await Session.insertMany(sampleSessions);
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
        nextSteps: session.nextSteps
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
 * Create a new session (therapists only)
 */
export const POST = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const childId = url.pathname.split('/')[3];

    // Only therapists can create sessions
    if (user.role !== 'therapist') {
      return ErrorResponse.forbidden(
        'Only therapists can create sessions',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return ErrorResponse.badRequest('Invalid child ID', 'VALIDATION_ERROR');
    }

    await connectToDatabase();

    try {
      const body = await request.json();
      
      // Check if child exists and therapist has access
      const child = await Child.findById(childId);
      if (!child) {
        return ErrorResponse.notFound('Child not found', 'RESOURCE_NOT_FOUND');
      }

      if (child.therapistId && child.therapistId.toString() !== user.userId) {
        return ErrorResponse.forbidden('Access denied', 'INSUFFICIENT_PERMISSIONS');
      }

      // Create session
      const sessionData = {
        childId: new mongoose.Types.ObjectId(childId),
        therapistId: new mongoose.Types.ObjectId(user.userId),
        date: new Date(body.date),
        time: body.time,
        duration: body.duration || 60,
        type: body.type || 'in-person',
        status: body.status || 'scheduled',
        goals: body.goals || [],
        notes: body.notes,
        location: body.location,
        meetingUrl: body.meetingUrl
      };

      const session = new Session(sessionData);
      await session.save();

      return SuccessResponse.created(
        { session },
        'Session created successfully'
      );

    } catch (error) {
      console.error(`Error creating session for child ${childId}:`, error);
      throw error;
    }
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