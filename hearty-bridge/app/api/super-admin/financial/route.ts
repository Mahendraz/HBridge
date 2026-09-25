import { NextRequest } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import { buildInvoiceQuery, effectiveInvoiceStatus } from '@/lib/utils/financial-query';

const EXPORT_LIMIT = 5000;

/**
 * GET /api/super-admin/financial
 * Super Admin only. All invoices across all parents with revenue summary —
 * the payment history per child (SA-4).
 * Query: see buildInvoiceQuery (status, from, to, program, childId, search),
 * plus ?page=1, ?limit=20, or ?all=1 for every matching row (export, max 5000).
 */
export const GET = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const all     = params.get('all') === '1';
    const page    = all ? 1 : Math.max(1, parseInt(params.get('page') || '1', 10));
    const limit   = all ? EXPORT_LIMIT : Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));
    const skip    = (page - 1) * limit;

    const now = new Date();
    const query = await buildInvoiceQuery(params, now);

    const [invoices, total, summaryAgg, filteredAgg] = await Promise.all([
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
      // Totals of just the rows matching the current filters (e.g. one child's history)
      Invoice.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            paidAmount:   { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
            unpaidAmount: { $sum: { $cond: [{ $ne: ['$status', 'paid'] }, '$amount', 0] } },
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
      status: effectiveInvoiceStatus(inv.status, inv.dueDate, now),
    }));

    return SuccessResponse.ok({
      invoices: enriched,
      total,
      page,
      limit,
      filteredSummary: {
        paidAmount:   filteredAgg[0]?.paidAmount ?? 0,
        unpaidAmount: filteredAgg[0]?.unpaidAmount ?? 0,
      },
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
