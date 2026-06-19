import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse, logRequest } from '@/lib/utils/error-handler';
import { assignTherapistSchema, childIdSchema, validateChildData } from '@/lib/validation/child';
import { 
  formatChildForResponse, 
  canAssignTherapist,
  canTherapistBeAssigned,
  generateChildActivityLog
} from '@/lib/utils/child';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import User from '@/models/User';
import mongoose from 'mongoose';

/**
 * PUT /api/children/[id]/assign-therapist
 * Assign or unassign a therapist to a child (parents only)
 */
export const PUT = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get child ID from path
    logRequest('PUT', `/api/children/${id}/assign-therapist`, user);

    // Only parents can assign therapists to their children
    if (user.role !== 'parent') {
      return ErrorResponse.forbidden(
        'Only parents can assign therapists to children',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    // Validate child ID
    const idValidation = validateChildData(childIdSchema, { id: id });
    if (!idValidation.success) {
      return ErrorResponse.badRequest(
        'Invalid child ID',
        'VALIDATION_ERROR',
        idValidation.errors
      );
    }

    await connectToDatabase();

    try {
      // Parse request body
      const body = await request.json();
      
      // Handle unassign request (therapistId: null or empty string)
      if (body.therapistId === null || body.therapistId === '') {
        return await unassignTherapist(id, user);
      }

      // Validate therapist assignment data
      const validation = validateChildData(assignTherapistSchema, body);
      if (!validation.success) {
        return ErrorResponse.badRequest(
          'Invalid therapist assignment data',
          'VALIDATION_ERROR',
          validation.errors
        );
      }

      const { therapistId } = validation.data;

      // Find child
      const child = await Child.findOne({
        _id: id,
        isActive: true
      });

      if (!child) {
        return ErrorResponse.notFound(
          'Child not found',
          'RESOURCE_NOT_FOUND'
        );
      }

      // Check if user can assign therapist to this child
      if (!canAssignTherapist(user, child)) {
        return ErrorResponse.forbidden(
          'You can only assign therapists to your own children',
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      // Find and validate therapist
      const therapist = await User.findOne({
        _id: therapistId,
        isActive: true,
        role: 'therapist'
      });

      if (!therapist) {
        return ErrorResponse.notFound(
          'Therapist not found or is not active',
          'RESOURCE_NOT_FOUND'
        );
      }

      // Validate if therapist can be assigned
      const assignmentValidation = canTherapistBeAssigned(therapist, child);
      if (!assignmentValidation.valid) {
        return ErrorResponse.badRequest(
          assignmentValidation.reason!,
          'INVALID_OPERATION'
        );
      }

      // Check if already assigned to the same therapist
      if (child.therapistId?.toString() === therapistId) {
        return ErrorResponse.badRequest(
          'Child is already assigned to this therapist',
          'INVALID_OPERATION'
        );
      }

      // Assign therapist
      const updatedChild = await Child.findByIdAndUpdate(
        id,
        { $set: { therapistId: new mongoose.Types.ObjectId(therapistId) } },
        { 
          new: true,
          populate: { 
            path: 'therapistId', 
            select: 'name email profile.specialization profile.clinic' 
          }
        }
      );

      if (!updatedChild) {
        return ErrorResponse.notFound(
          'Child not found after assignment',
          'RESOURCE_NOT_FOUND'
        );
      }

      // Generate activity log
      const activityLog = generateChildActivityLog(
        'assigned_therapist', 
        updatedChild, 
        user,
        { therapistName: therapist.name, therapistEmail: therapist.email }
      );
      console.log(activityLog);

      // Format response
      const formattedChild = formatChildForResponse(updatedChild, true);

      return SuccessResponse.ok(
        { 
          child: formattedChild,
          therapist: {
            id: therapist._id.toString(),
            name: therapist.name,
            email: therapist.email,
            specialization: therapist.profile?.specialization,
            clinic: therapist.profile?.clinic
          }
        },
        `Therapist ${therapist.name} assigned to ${updatedChild.name} successfully`
      );

    } catch (error) {
      console.error(`Error assigning therapist to child ${id}:`, error);
      throw error;
    }
  })
);

/**
 * Helper function to unassign therapist from child
 */
async function unassignTherapist(childId: string, user: any) {
  try {
    // Find child
    const child = await Child.findOne({
      _id: childId,
      isActive: true
    });

    if (!child) {
      return ErrorResponse.notFound(
        'Child not found',
        'RESOURCE_NOT_FOUND'
      );
    }

    // Check permissions
    if (!canAssignTherapist(user, child)) {
      return ErrorResponse.forbidden(
        'You can only unassign therapists from your own children',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    // Check if child has a therapist assigned
    if (!child.therapistId) {
      return ErrorResponse.badRequest(
        'Child does not have a therapist assigned',
        'INVALID_OPERATION'
      );
    }

    // Get therapist info for logging
    const therapist = await User.findById(child.therapistId).select('name email');

    // Unassign therapist
    const updatedChild = await Child.findByIdAndUpdate(
      childId,
      { $unset: { therapistId: 1 } },
      { new: true }
    );

    if (!updatedChild) {
      return ErrorResponse.notFound(
        'Child not found after unassignment',
        'RESOURCE_NOT_FOUND'
      );
    }

    // Generate activity log
    const activityLog = generateChildActivityLog(
      'unassigned_therapist', 
      updatedChild, 
      user,
      { therapistName: therapist?.name, therapistEmail: therapist?.email }
    );
    console.log(activityLog);

    // Format response
    const formattedChild = formatChildForResponse(updatedChild, true);

    return SuccessResponse.ok(
      { child: formattedChild },
      `Therapist unassigned from ${updatedChild.name} successfully`
    );

  } catch (error) {
    console.error(`Error unassigning therapist from child ${childId}:`, error);
    throw error;
  }
}

/**
 * GET /api/children/[id]/assign-therapist
 * Get assignment status and available therapists for assignment
 */
export const GET = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // Get child ID from path
    logRequest('GET', `/api/children/${id}/assign-therapist`, user);

    // Only parents can view assignment options for their children
    if (user.role !== 'parent') {
      return ErrorResponse.forbidden(
        'Only parents can view therapist assignment options',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    // Validate child ID
    const idValidation = validateChildData(childIdSchema, { id: id });
    if (!idValidation.success) {
      return ErrorResponse.badRequest(
        'Invalid child ID',
        'VALIDATION_ERROR',
        idValidation.errors
      );
    }

    await connectToDatabase();

    try {
      // Find child
      const child = await Child.findOne({
        _id: id,
        isActive: true
      }).populate('therapistId', 'name email profile.specialization profile.clinic');

      if (!child) {
        return ErrorResponse.notFound(
          'Child not found',
          'RESOURCE_NOT_FOUND'
        );
      }

      // Check permissions
      if (!canAssignTherapist(user, child)) {
        return ErrorResponse.forbidden(
          'You can only view assignment options for your own children',
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      // Get available therapists
      const availableTherapists = await User.find({
        role: 'therapist',
        isActive: true
      })
      .select('name email profile.specialization profile.clinic profile.experience')
      .sort('name')
      .limit(50); // Limit to prevent large responses

      // Format current assignment
      let currentAssignment = null;
      if (child.therapistId && typeof child.therapistId === 'object') {
        const therapist = child.therapistId as any;
        currentAssignment = {
          id: therapist._id.toString(),
          name: therapist.name,
          email: therapist.email,
          specialization: therapist.profile?.specialization,
          clinic: therapist.profile?.clinic
        };
      }

      // Format available therapists
      const formattedTherapists = availableTherapists.map(therapist => ({
        id: therapist._id.toString(),
        name: therapist.name,
        email: therapist.email,
        specialization: therapist.profile?.specialization,
        clinic: therapist.profile?.clinic,
        experience: therapist.profile?.experience,
        isCurrentlyAssigned: child.therapistId?.toString() === therapist._id.toString()
      }));

      return SuccessResponse.ok({
        child: {
          id: child._id.toString(),
          name: child.name,
          age: child.getAge()
        },
        currentAssignment,
        availableTherapists: formattedTherapists,
        totalAvailable: formattedTherapists.length
      }, 'Therapist assignment options retrieved successfully');

    } catch (error) {
      console.error(`Error getting therapist assignment options for child ${id}:`, error);
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