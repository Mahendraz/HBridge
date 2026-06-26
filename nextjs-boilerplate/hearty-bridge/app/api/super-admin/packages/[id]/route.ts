import { NextRequest } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Package from '@/models/Package';
import mongoose from 'mongoose';
import { z } from 'zod';

function getPackageId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 1] || '';
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  sessions: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  therapyType: z.enum(['OT', 'TW', 'both']).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/super-admin/packages/[id]
 */
export const GET = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getPackageId(req);
    if (!mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('Invalid ID');

    await connectToDatabase();
    const pkg = await Package.findById(id).lean();
    if (!pkg) return ErrorResponse.notFound('Package');

    return SuccessResponse.ok({ package: pkg });
  })
);

/**
 * PUT /api/super-admin/packages/[id]
 */
export const PUT = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getPackageId(req);
    if (!mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('Invalid ID');

    const body = await req.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return ErrorResponse.badRequest('Invalid input', 'VALIDATION_ERROR', result.error.issues);
    }

    await connectToDatabase();
    const pkg = await Package.findByIdAndUpdate(
      id,
      { $set: result.data },
      { new: true, runValidators: true }
    ).lean();

    if (!pkg) return ErrorResponse.notFound('Package');

    return SuccessResponse.ok({ package: pkg });
  })
);

/**
 * DELETE /api/super-admin/packages/[id]
 * Soft-delete: set isActive = false
 */
export const DELETE = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getPackageId(req);
    if (!mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('Invalid ID');

    await connectToDatabase();
    const pkg = await Package.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    ).lean();

    if (!pkg) return ErrorResponse.notFound('Package');

    return SuccessResponse.ok({ message: 'Package deactivated' });
  })
);
