import { NextRequest } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Package from '@/models/Package';
import mongoose from 'mongoose';
import { z } from 'zod';
import { logActivity } from '@/lib/utils/audit-log';

function getPackageId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 1] || '';
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  sessions: z.number().int().min(1).optional(),
  price: z.number().min(0).optional(),
  therapyType: z.enum(['OT', 'TW', 'both', 'assessment']).optional(),
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

    const existing = await Package.findById(id).lean();
    if (!existing) return ErrorResponse.notFound('Package');

    const effectiveTherapyType = result.data.therapyType ?? (existing as any).therapyType;
    const effectiveSessions = result.data.sessions ?? (existing as any).sessions;
    if (effectiveTherapyType === 'assessment' && effectiveSessions !== 1) {
      return ErrorResponse.badRequest('Paket assessment harus memiliki tepat 1 sesi');
    }

    const pkg = await Package.findByIdAndUpdate(
      id,
      { $set: result.data },
      { new: true, runValidators: true }
    ).lean();

    if (!pkg) return ErrorResponse.notFound('Package');

    type PackageSummary = { name: string; therapyType: string; sessions: number; price?: number; isActive: boolean };
    const p = pkg as unknown as PackageSummary;
    const prev = existing as unknown as PackageSummary;
    const toggled = result.data.isActive !== undefined && result.data.isActive !== prev.isActive;
    const action = toggled ? (p.isActive ? 'package.activated' : 'package.deactivated') : 'package.updated';
    logActivity(req, {
      category: 'finance',
      action,
      title: `Paket ${toggled ? (p.isActive ? 'diaktifkan' : 'dinonaktifkan') : 'diperbarui'} — ${p.name}`,
      description: `${p.therapyType} · ${p.sessions} sesi · Rp ${new Intl.NumberFormat('id-ID').format(p.price ?? 0)}`,
      actor: user,
      target: { type: 'package', id, name: p.name },
      metadata: {
        fields: Object.keys(result.data),
        ...(result.data.price !== undefined && result.data.price !== prev.price && { previousPrice: prev.price }),
      },
    });

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

    const deleted = pkg as unknown as { name: string; therapyType: string; sessions: number };
    logActivity(req, {
      category: 'finance',
      action: 'package.deleted',
      title: `Paket dihapus — ${deleted.name}`,
      description: `${deleted.therapyType} · ${deleted.sessions} sesi`,
      actor: user,
      target: { type: 'package', id, name: deleted.name },
    });

    return SuccessResponse.ok({ message: 'Package deactivated' });
  })
);
