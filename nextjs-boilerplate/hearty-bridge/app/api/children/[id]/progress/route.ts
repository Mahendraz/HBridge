import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Progress from '@/models/Progress';
import Child from '@/models/Child';
import mongoose from 'mongoose';

/**
 * GET /api/children/[id]/progress
 * Get progress data for a specific child
 */
export const GET = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const childId = url.pathname.split('/')[3]; // Extract child ID from path

    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return ErrorResponse.badRequest('Invalid child ID', 'VALIDATION_ERROR');
    }

    await connectToDatabase();

    try {
      // First check if child exists and user has access
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

      // Get progress data
      let progressData = await Progress.findByChild(new mongoose.Types.ObjectId(childId));

      // If no progress data exists, create default data
      if (!progressData) {
        progressData = new Progress({
          childId: new mongoose.Types.ObjectId(childId),
          therapistId: child.therapistId || new mongoose.Types.ObjectId(user.userId),
          overallProgress: 0,
          weeklyProgress: [],
          skillAreas: [
            { area: 'Communication', currentLevel: 0, targetLevel: 80, progress: 0 },
            { area: 'Social Skills', currentLevel: 0, targetLevel: 80, progress: 0 },
            { area: 'Motor Skills', currentLevel: 0, targetLevel: 80, progress: 0 },
            { area: 'Cognitive Development', currentLevel: 0, targetLevel: 80, progress: 0 }
          ],
          milestones: [
            {
              title: 'Initial Assessment',
              description: 'Complete comprehensive therapy assessment',
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              status: 'upcoming'
            }
          ],
          recentNotes: []
        });
        await progressData.save();
      }

      // Format response
      const formattedProgress = {
        childId: progressData.childId,
        childName: child.name,
        overallProgress: progressData.overallProgress,
        weeklyProgress: progressData.weeklyProgress,
        skillAreas: progressData.skillAreas,
        milestones: progressData.milestones.map((milestone, index) => ({
          id: index.toString(),
          title: milestone.title,
          description: milestone.description,
          achievedDate: milestone.achievedDate?.toISOString(),
          targetDate: milestone.targetDate.toISOString(),
          status: milestone.status
        })),
        recentNotes: progressData.recentNotes.map(note => ({
          date: note.date.toISOString(),
          therapist: note.therapist,
          note: note.note,
          rating: note.rating
        }))
      };

      return SuccessResponse.ok(
        { progress: formattedProgress },
        'Progress data retrieved successfully'
      );

    } catch (error) {
      console.error(`Error fetching progress for child ${childId}:`, error);
      throw error;
    }
  })
);

/**
 * PUT /api/children/[id]/progress
 * Update progress data for a specific child (therapists only)
 */
export const PUT = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const childId = url.pathname.split('/')[3];

    // Only therapists can update progress
    if (user.role !== 'therapist') {
      return ErrorResponse.forbidden(
        'Only therapists can update progress data',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    if (!mongoose.Types.ObjectId.isValid(childId)) {
      return ErrorResponse.badRequest('Invalid child ID', 'VALIDATION_ERROR');
    }

    await connectToDatabase();

    try {
      const body = await request.json();

      // Find existing progress or create new
      let progressData = await Progress.findOne({ 
        childId: new mongoose.Types.ObjectId(childId), 
        isActive: true 
      });

      if (!progressData) {
        const child = await Child.findById(childId);
        if (!child) {
          return ErrorResponse.notFound('Child not found', 'RESOURCE_NOT_FOUND');
        }

        progressData = new Progress({
          childId: new mongoose.Types.ObjectId(childId),
          therapistId: new mongoose.Types.ObjectId(user.userId)
        });
      }

      // Update fields if provided
      if (body.skillAreas) {
        progressData.skillAreas = body.skillAreas;
      }
      if (body.milestones) {
        progressData.milestones = body.milestones.map((milestone: any) => ({
          ...milestone,
          targetDate: new Date(milestone.targetDate),
          achievedDate: milestone.achievedDate ? new Date(milestone.achievedDate) : undefined
        }));
      }
      if (body.recentNotes) {
        progressData.recentNotes = body.recentNotes.map((note: any) => ({
          ...note,
          date: new Date(note.date)
        }));
      }
      if (body.weeklyProgress) {
        progressData.weeklyProgress = body.weeklyProgress.map((week: any) => ({
          ...week,
          date: new Date(week.date)
        }));
      }

      await progressData.save();

      return SuccessResponse.ok(
        { progress: progressData },
        'Progress updated successfully'
      );

    } catch (error) {
      console.error(`Error updating progress for child ${childId}:`, error);
      throw error;
    }
  })
);

/**
 * Handle unsupported HTTP methods
 */
export async function POST() {
  return ErrorResponse.methodNotAllowed(['GET', 'PUT']);
}

export async function DELETE() {
  return ErrorResponse.methodNotAllowed(['GET', 'PUT']);
}

export async function PATCH() {
  return ErrorResponse.methodNotAllowed(['GET', 'PUT']);
}