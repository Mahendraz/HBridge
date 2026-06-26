import { NextRequest } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse, logRequest } from '@/lib/utils/error-handler';
import { createChildSchema, childQuerySchema, validateChildData } from '@/lib/validation/child';
import { 
  formatChildrenForResponse, 
  canAccessChild, 
  buildChildSearchQuery, 
  buildChildSortQuery,
  calculatePagination,
  prepareChildDataForStorage,
  generateChildActivityLog
} from '@/lib/utils/child';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import User from '@/models/User';
import WeeklySchedule from '@/models/WeeklySchedule';
import TokenTransaction from '@/models/TokenTransaction';
import { getR2SignedUrl } from '@/lib/services/r2-storage';
import Session from '@/models/Session';
import mongoose from 'mongoose';

/**
 * GET /api/children
 * List children with role-based filtering and pagination
 */
export const GET = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    logRequest('GET', '/api/children', user);

    await connectToDatabase();

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validation = validateChildData(childQuerySchema, queryParams);
    if (!validation.success) {
      return ErrorResponse.badRequest(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        validation.errors
      );
    }

    const { page, limit, search, therapistId, hasTherapist, sortBy, sortOrder } = validation.data;

    // Build search query based on user role and filters
    const searchQuery = buildChildSearchQuery(user, {
      search,
      therapistId,
      hasTherapist
    });

    // Build sort query
    const sortQuery = buildChildSortQuery(sortBy, sortOrder);

    try {
      // For therapist: restrict to children appearing in their schedule slots
      if (user.role === 'therapist') {
        const slots = await WeeklySchedule.find({ therapistId: user.userId })
          .select('patientId')
          .lean();
        const patientIds = [...new Set((slots as any[]).map((s: any) => s.patientId))];
        searchQuery._id = { $in: patientIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
      }

      // Get total count for pagination
      const totalCount = await Child.countDocuments(searchQuery);

      // Calculate pagination
      const pagination = calculatePagination(page, limit, totalCount);
      const skip = (page - 1) * limit;

      // Fetch children with pagination
      let childrenQuery = Child.find(searchQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit);

      // Populate related data based on user role
      if (user.role === 'parent') {
        childrenQuery = childrenQuery.populate('therapistId', 'name email profile.specialization profile.clinic');
      } else if (user.role === 'therapist') {
        childrenQuery = childrenQuery.populate('parentId', 'name email phone');
      } else if (user.role === 'admin') {
        childrenQuery = childrenQuery
          .populate('parentId', 'name email phone')
          .populate('therapistId', 'name email profile.specialization profile.clinic');
      }

      const children = await childrenQuery.exec();

      // Format response based on user role and permissions
      const formattedChildren: any[] = children.map(child => {
        const hasAccess = user.role === 'admin' || user.role === 'therapist'
          ? true
          : canAccessChild(user, child);
        return formatChildrenForResponse([child], hasAccess)[0];
      });

      // Children may have no therapistId in the Child doc (assignment stored in WeeklySchedule).
      // Look up the therapist from WeeklySchedule for any child missing therapist info.
      const missingTherapist = formattedChildren.filter((c: any) => !c.therapist);
      if (missingTherapist.length > 0) {
        const childIds = missingTherapist.map((c: any) => c.id);
        const slots = await WeeklySchedule.find({ patientId: { $in: childIds } })
          .select('patientId therapistId')
          .lean();

        const childToTherapist: Record<string, string> = {};
        for (const slot of slots as any[]) {
          childToTherapist[slot.patientId.toString()] = slot.therapistId.toString();
        }

        if (Object.keys(childToTherapist).length > 0) {
          const therapistIds = [...new Set(Object.values(childToTherapist))];
          const therapists = await User.find({ _id: { $in: therapistIds } })
            .select('name email profile')
            .lean();
          const therapistById: Record<string, any> = {};
          for (const t of therapists as any[]) {
            therapistById[t._id.toString()] = t;
          }

          for (const child of formattedChildren) {
            const tId = childToTherapist[child.id];
            if (tId && therapistById[tId]) {
              const t = therapistById[tId];
              child.therapist = {
                id: t._id.toString(),
                name: t.name,
                email: t.email,
                specialization: t.profile?.specialization,
                clinic: t.profile?.clinic,
              };
            }
          }
        }
      }

      // Add therapy type breakdown from token transactions (sum of topup amounts per therapyType)
      const childObjectIds = formattedChildren
        .map((c: any) => new mongoose.Types.ObjectId(c.id));

      if (childObjectIds.length > 0) {
        const breakdowns = await TokenTransaction.aggregate([
          {
            $match: {
              childId: { $in: childObjectIds },
              type: 'topup',
              packageType: { $ne: null },
              therapyType: { $ne: null },
            },
          },
          {
            $group: {
              _id: { childId: '$childId', therapyType: '$therapyType' },
              total: { $sum: '$amount' },
            },
          },
        ]);

        const therapyByChild: Record<string, Record<string, number>> = {};
        for (const b of breakdowns) {
          const cid = b._id.childId.toString();
          const type = b._id.therapyType as string;
          if (!therapyByChild[cid]) therapyByChild[cid] = {};
          therapyByChild[cid][type] = b.total;
        }

        for (const child of formattedChildren) {
          child.therapyBalance = therapyByChild[child.id] ?? {};
        }

        // Add session progress (completed / total) per child
        const now = new Date();
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

        const sessionAgg = await Session.aggregate([
          { $match: { childId: { $in: childObjectIds }, isActive: true } },
          {
            $group: {
              _id: '$childId',
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              completedThisMonth: {
                $sum: {
                  $cond: [
                    { $and: [
                      { $eq: ['$status', 'completed'] },
                      { $gte: ['$date', monthStart] },
                      { $lt: ['$date', monthEnd] },
                    ]},
                    1, 0,
                  ],
                },
              },
            },
          },
        ]);
        const sessionByChild: Record<string, { completed: number; total: number; completedThisMonth: number }> = {};
        for (const s of sessionAgg) {
          sessionByChild[s._id.toString()] = {
            completed: s.completed,
            total: s.total,
            completedThisMonth: s.completedThisMonth,
          };
        }
        for (const child of formattedChildren) {
          const sp = sessionByChild[child.id] ?? null;
          child.sessionProgress = sp ? { completed: sp.completed, total: sp.total } : null;
          child.sessionsThisMonth = sp?.completedThisMonth ?? 0;
        }
      }

      // Sign R2 photo keys
      await Promise.all(
        formattedChildren
          .filter((c: any) => c.photoUrl && !c.photoUrl.startsWith('http'))
          .map(async (c: any) => {
            c.photoUrl = await getR2SignedUrl(c.photoUrl, 3600) ?? c.photoUrl;
          })
      );

      return SuccessResponse.ok({
        children: formattedChildren,
        pagination,
        filters: {
          search: search || null,
          therapistId: therapistId || null,
          hasTherapist,
          sortBy,
          sortOrder
        }
      }, `Found ${totalCount} children`);

    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  })
);

/**
 * POST /api/children
 * Create a new child (parents only)
 */
export const POST = withAnyAuth(
  withErrorHandling(async (request: NextRequest, user: any) => {
    logRequest('POST', '/api/children', user);

    // Only parents and admins can create children
    if (user.role !== 'parent' && user.role !== 'admin') {
      return ErrorResponse.forbidden(
        'Only parents and admins can create child profiles',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    await connectToDatabase();

    try {
      const body = await request.json();

      // Extract parentId for admin use before schema validation
      const { parentId: bodyParentId, ...childBody } = body;

      // Validate input data
      const validation = validateChildData(createChildSchema, childBody);
      if (!validation.success) {
        return ErrorResponse.badRequest(
          'Invalid child data',
          'VALIDATION_ERROR',
          validation.errors
        );
      }

      const childData = validation.data;

      // Determine parentId based on role
      let effectiveParentId: mongoose.Types.ObjectId;

      if (user.role === 'admin') {
        if (!bodyParentId || !/^[0-9a-fA-F]{24}$/.test(bodyParentId)) {
          return ErrorResponse.badRequest('Valid parentId is required when admin creates a child', 'VALIDATION_ERROR');
        }
        const parentUser = await User.findOne({ _id: bodyParentId, role: 'parent', isActive: true });
        if (!parentUser) {
          return ErrorResponse.notFound('Parent user not found');
        }
        effectiveParentId = new mongoose.Types.ObjectId(bodyParentId);
      } else {
        effectiveParentId = new mongoose.Types.ObjectId(user.userId);
      }

      // Prepare data for storage
      const sanitizedData = prepareChildDataForStorage({
        ...childData,
        parentId: effectiveParentId,
        dateOfBirth: new Date(childData.dateOfBirth),
        isActive: true
      });

      // Create child
      const child = new Child(sanitizedData);
      await child.save();

      // Populate therapist info for response
      await child.populate('therapistId', 'name email profile.specialization profile.clinic');

      // Generate activity log
      const activityLog = generateChildActivityLog('created', child, user);
      console.log(activityLog);

      // Format response
      const formattedChild = formatChildrenForResponse([child], true)[0];

      return SuccessResponse.created(
        { child: formattedChild },
        'Child profile created successfully'
      );

    } catch (error) {
      console.error('Error creating child:', error);
      
      // Handle specific MongoDB errors
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