import { NextRequest } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Package from '@/models/Package';
import mongoose from 'mongoose';
import { z } from 'zod';

const packageSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  sessions: z.number().int().min(1),
  price: z.number().min(0),
  therapyType: z.enum(['OT', 'TW', 'both']),
  description: z.string().max(500).optional(),
});

/**
 * GET /api/super-admin/packages
 * Super Admin only. List all packages.
 * Query: ?active=true|false (filter by isActive)
 */
export const GET = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const activeParam = params.get('active');

    const query: any = {};
    if (activeParam === 'true') query.isActive = true;
    else if (activeParam === 'false') query.isActive = false;

    const packages = await Package.find(query).sort({ createdAt: -1 }).lean();

    return SuccessResponse.ok({ packages });
  })
);

/**
 * POST /api/super-admin/packages
 * Super Admin only. Create a new package.
 */
export const POST = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const body = await req.json();
    const result = packageSchema.safeParse(body);
    if (!result.success) {
      return ErrorResponse.badRequest('Invalid input', 'VALIDATION_ERROR', result.error.issues);
    }

    const { name, sessions, price, therapyType, description } = result.data;

    const pkg = await Package.create({
      name,
      sessions,
      price,
      therapyType,
      description: description || '',
      isActive: true,
      createdBy: new mongoose.Types.ObjectId(user.userId),
    });

    return SuccessResponse.created({ package: pkg });
  })
);
