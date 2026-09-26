import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse, logRequest } from '@/lib/utils/error-handler';
import { updateChildSchema, childIdSchema, validateChildData } from '@/lib/validation/child';
import { 
  formatChildForResponse, 
  canAccessChild, 
  canModifyChild,
  prepareChildDataForStorage,
  generateChildActivityLog,
  validateChildAge
} from '@/lib/utils/child';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import WeeklySchedule from '@/models/WeeklySchedule';
import mongoose from 'mongoose';
import { getR2SignedUrl } from '@/lib/services/r2-storage';
import { deleteChildAccount } from '@/lib/utils/account-deletion';
import { getSessionBalances, getTherapistsByProgram, emptySessionBalance } from '@/lib/utils/session-balance';
import { therapistHasChild } from '@/lib/utils/therapist-access';

/**
 * GET /api/children/[id]
 * Get a specific child by ID with role-based access control
 */
export const GET = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    logRequest('GET', `/api/children/${id}`, user);

    // Validate child ID
    const idValidation = validateChildData(childIdSchema, { id });
    if (!idValidation.success) {
      return ErrorResponse.badRequest(
        'Invalid child ID',
        'VALIDATION_ERROR',
        idValidation.errors
      );
    }

    await connectToDatabase();

    try {
      // Find child with populated references
      let childQuery = Child.findOne({
        _id: id,
        isActive: true
      });

      // Populate based on user role
      if (user.role === 'parent') {
        // Parents get their own contact details too (the "Orang Tua" card, incl.
        // editing their address). Access is checked against the child below.
        childQuery = childQuery
          .populate('parentId', 'name email phone profile.address')
          .populate('therapistId', 'name email profile.specialization profile.clinic');
      } else {
        // Admin and therapist both get full populate
        childQuery = childQuery
          .populate('parentId', 'name email phone profile.address')
          .populate('therapistId', 'name email profile.specialization profile.clinic');
      }

      const child = await childQuery.exec();

      if (!child) {
        return ErrorResponse.notFound(
          'Child not found',
          'RESOURCE_NOT_FOUND'
        );
      }

      // Check access permissions: admins see every child, parents their own,
      // therapists only their patients (medical info + parent contact inside).
      if (
        (user.role === 'parent' && !canAccessChild(user, child)) ||
        (user.role === 'therapist' && !(await therapistHasChild(user.userId, child._id.toString())))
      ) {
        return ErrorResponse.forbidden(
          'You do not have permission to view this child',
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      // Format response with full details for authorized users
      const formattedChild = formatChildForResponse(child, true);

      // Weekly schedule days + earliest effectiveFrom, used to show
      // "hari jadwal" and a real "tanggal mulai terapi" (Child has no such
      // field — createdAt is registration date, not therapy start date).
      const scheduleSlots = await WeeklySchedule.find({ patientId: id })
        .select('day effectiveFrom')
        .lean();
      const scheduleDays = Array.from(new Set(scheduleSlots.map((s: any) => s.day)));
      const effectiveFromTimes = scheduleSlots
        .map((s: any) => s.effectiveFrom)
        .filter(Boolean)
        .map((d: any) => new Date(d).getTime());
      (formattedChild as any).scheduleDays = scheduleDays;
      (formattedChild as any).therapyStartDate = effectiveFromTimes.length
        ? new Date(Math.min(...effectiveFromTimes)).toISOString()
        : null;

      // Therapists per program (OT: A, TW: B) and sisa sesi per program — the
      // same helper the dashboard and patient list use, so the numbers match.
      const [therapistsMap, balanceMap] = await Promise.all([
        getTherapistsByProgram([id!]),
        getSessionBalances([id!]),
      ]);
      (formattedChild as any).therapistsByProgram = therapistsMap.get(id!) ?? [];
      (formattedChild as any).sessionBalance = balanceMap.get(id!) ?? emptySessionBalance(id!);

      // Sign R2 key for photo if present
      if (formattedChild.photoUrl && !formattedChild.photoUrl.startsWith('http')) {
        formattedChild.photoUrl = await getR2SignedUrl(formattedChild.photoUrl, 3600) ?? formattedChild.photoUrl;
      }

      return SuccessResponse.ok(
        { child: formattedChild },
        'Child retrieved successfully'
      );

    } catch (error) {
      console.error(`Error fetching child ${id}:`, error);
      throw error;
    }
  })
);

/**
 * PUT /api/children/[id]
 * Update a specific child with role-based permissions
 */
export const PUT = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    logRequest('PUT', `/api/children/${id}`, user);

    // Validate child ID
    const idValidation = validateChildData(childIdSchema, { id });
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
      });

      if (!child) {
        return ErrorResponse.notFound(
          'Child not found',
          'RESOURCE_NOT_FOUND'
        );
      }

      // Check modification permissions (admin and super_admin can always modify)
      if (user.role !== 'admin' && user.role !== 'super_admin' && !canModifyChild(user, child)) {
        return ErrorResponse.forbidden(
          'You do not have permission to modify this child',
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      // Parse and validate request body
      const body = await request.json();
      const validation = validateChildData(updateChildSchema, body);
      if (!validation.success) {
        return ErrorResponse.badRequest(
          'Invalid update data',
          'VALIDATION_ERROR',
          validation.errors
        );
      }

      const updateData = validation.data;

      // For therapists, restrict what they can modify
      if (user.role === 'therapist') {
        // Therapists can only update medical notes for assigned children
        const allowedFields = ['medicalInfo'];
        const providedFields = Object.keys(updateData);
        const unauthorizedFields = providedFields.filter(field => !allowedFields.includes(field));
        
        if (unauthorizedFields.length > 0) {
          return ErrorResponse.forbidden(
            `Therapists can only update medical information. Unauthorized fields: ${unauthorizedFields.join(', ')}`,
            'INSUFFICIENT_PERMISSIONS'
          );
        }
      }

      // Validate age constraints if date of birth is being updated
      if (updateData.dateOfBirth) {
        const ageValidation = validateChildAge(new Date(updateData.dateOfBirth));
        if (!ageValidation.valid) {
          return ErrorResponse.badRequest(
            ageValidation.message!,
            'VALIDATION_ERROR'
          );
        }
      }

      // Prepare and sanitize update data
      const sanitizedUpdateData = prepareChildDataForStorage(updateData);

      // Convert date string to Date object if provided
      if (sanitizedUpdateData.dateOfBirth) {
        sanitizedUpdateData.dateOfBirth = new Date(sanitizedUpdateData.dateOfBirth);
      }

      // Update child
      const updatedChild = await Child.findByIdAndUpdate(
        id,
        { $set: sanitizedUpdateData },
        { 
          new: true, 
          runValidators: true,
          populate: user.role === 'parent'
            ? { path: 'therapistId', select: 'name email profile.specialization profile.clinic' }
            : { path: 'parentId', select: 'name email phone profile.address' }
        }
      );

      if (!updatedChild) {
        return ErrorResponse.notFound(
          'Child not found after update',
          'RESOURCE_NOT_FOUND'
        );
      }

      // Generate activity log
      const activityLog = generateChildActivityLog('updated', updatedChild, user);
      console.log(activityLog);

      // Format response
      const formattedChild = formatChildForResponse(updatedChild, true);

      return SuccessResponse.ok(
        { child: formattedChild },
        'Child updated successfully'
      );

    } catch (error) {
      console.error(`Error updating child ${id}:`, error);
      
      // Handle specific validation errors
      if (error instanceof Error && error.name === 'ValidationError') {
        return ErrorResponse.badRequest(
          'Child data validation failed',
          'VALIDATION_ERROR',
          Object.values((error as any).errors).map((err: any) => ({
            field: err.path,
            message: err.message
          }))
        );
      }

      throw error;
    }
  })
);

/**
 * DELETE /api/children/[id]
 * Soft delete a child account (ADM-3). Super Admin only — Admin files a
 * request via /api/deletion-requests. Session/invoice history is kept.
 */
export const DELETE = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    logRequest('DELETE', `/api/children/${id}`, user);

    if (user.role !== 'super_admin') {
      return ErrorResponse.forbidden(
        'Hapus akun anak harus lewat persetujuan Super Admin',
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
      });

      if (!child) {
        return ErrorResponse.notFound(
          'Child not found',
          'RESOURCE_NOT_FOUND'
        );
      }

      // Soft delete + take the child off the schedule
      await deleteChildAccount(id!);

      // Generate activity log
      const activityLog = generateChildActivityLog('deleted', child, user);
      console.log(activityLog);

      return SuccessResponse.ok(
        { 
          message: 'Child profile deleted successfully',
          deletedAt: new Date().toISOString()
        },
        'Child deleted successfully'
      );

    } catch (error) {
      console.error(`Error deleting child ${id}:`, error);
      throw error;
    }
  })
);

/**
 * Handle unsupported HTTP methods
 */
export async function POST() {
  return ErrorResponse.methodNotAllowed(['GET', 'PUT', 'DELETE']);
}

export async function PATCH() {
  return ErrorResponse.methodNotAllowed(['GET', 'PUT', 'DELETE']);
}