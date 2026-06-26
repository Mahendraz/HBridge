import { NextRequest } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import TokenTransaction from '@/models/TokenTransaction';

/**
 * GET /api/super-admin/financial/transactions
 * Super Admin only. All token transactions across all children.
 * Query: ?type=topup|deduct, ?therapyType=OT|TW, ?from=YYYY-MM-DD, ?to=YYYY-MM-DD, ?page=1, ?limit=20
 */
export const GET = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const type        = params.get('type') || '';
    const therapyType = params.get('therapyType') || '';
    const from        = params.get('from') || '';
    const to          = params.get('to') || '';
    const page        = Math.max(1, parseInt(params.get('page') || '1', 10));
    const limit       = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));
    const skip        = (page - 1) * limit;

    const query: any = {};

    if (type === 'topup' || type === 'deduct') query.type = type;
    if (therapyType === 'OT' || therapyType === 'TW') query.therapyType = therapyType;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from + 'T00:00:00Z');
      if (to)   query.createdAt.$lte = new Date(to + 'T23:59:59Z');
    }

    const [transactions, total] = await Promise.all([
      TokenTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('packageId', 'name sessions price therapyType')
        .lean(),
      TokenTransaction.countDocuments(query),
    ]);

    return SuccessResponse.ok({ transactions, total, page, limit });
  })
);
