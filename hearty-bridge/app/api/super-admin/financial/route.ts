import { NextRequest } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import mongoose from 'mongoose';

/**
 * GET /api/super-admin/financial
 * Super Admin only. All invoices across all parents with revenue summary.
 * Query: ?status=paid|unpaid|overdue, ?from=YYYY-MM-DD, ?to=YYYY-MM-DD, ?page=1, ?limit=20
 */
export const GET = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const status  = params.get('status') || '';
    const from    = params.get('from') || '';
    const to      = params.get('to') || '';
    const page    = Math.max(1, parseInt(params.get('page') || '1', 10));
    const limit   = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));
    const skip    = (page - 1) * limit;

    const now = new Date();
    const query: any = { isActive: { $ne: false } };

    if (status === 'paid') {
      query.status = 'paid';
    } else if (status === 'unpaid') {
      query.status = 'unpaid';
      query.dueDate = { $gte: now };
    } else if (status === 'overdue') {
      query.$or = [
        { status: 'overdue' },
        { status: 'unpaid', dueDate: { $lt: now } },
      ];
    }

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from + 'T00:00:00Z');
      if (to)   query.createdAt.$lte = new Date(to + 'T23:59:59Z');
    }

    const [invoices, total, summaryAgg] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('parentId', 'name email phone')
        .lean(),
      Invoice.countDocuments(query),
      Invoice.aggregate([
        { $match: { isActive: { $ne: false } } },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] },
            },
            totalPending: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'unpaid'] }, { $gte: ['$dueDate', now] }] },
                  '$amount',
                  0,
                ],
              },
            },
            totalOverdue: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'overdue'] },
                      { $and: [{ $eq: ['$status', 'unpaid'] }, { $lt: ['$dueDate', now] }] },
                    ],
                  },
                  '$amount',
                  0,
                ],
              },
            },
            countPaid:    { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            countUnpaid:  { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } },
            countOverdue: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'overdue'] },
                      { $and: [{ $eq: ['$status', 'unpaid'] }, { $lt: ['$dueDate', now] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = summaryAgg[0] ?? {
      totalRevenue: 0,
      totalPending: 0,
      totalOverdue: 0,
      countPaid: 0,
      countUnpaid: 0,
      countOverdue: 0,
      totalCount: 0,
    };

    const enriched = (invoices as any[]).map((inv) => ({
      ...inv,
      status: inv.status === 'unpaid' && new Date(inv.dueDate) < now ? 'overdue' : inv.status,
    }));

    return SuccessResponse.ok({
      invoices: enriched,
      total,
      page,
      limit,
      summary: {
        totalRevenue: summary.totalRevenue,
        totalPending: summary.totalPending,
        totalOverdue: summary.totalOverdue,
        countPaid: summary.countPaid,
        countUnpaid: summary.countUnpaid,
        countOverdue: summary.countOverdue,
        totalCount: summary.totalCount,
      },
    });
  })
);
