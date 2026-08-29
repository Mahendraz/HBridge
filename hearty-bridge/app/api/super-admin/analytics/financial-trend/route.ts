import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';

/**
 * GET /api/super-admin/analytics/financial-trend?months=12
 * Monthly revenue collected (paid invoices, by paidAt) + monthly amount invoiced
 * (by createdAt), plus a running cumulative revenue total for the trend line.
 * Super admin only — financial figures are not part of the shared admin/analytics scope.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (user.role !== 'super_admin') {
      return ErrorResponse.forbidden('Anda tidak memiliki akses data keuangan');
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const months = Math.min(36, Math.max(1, parseInt(url.searchParams.get('months') || '12', 10)));

    const now = new Date();
    const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

    // Revenue actually collected per month (paid invoices, grouped by paidAt).
    const revenueAgg = await Invoice.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: rangeStart, $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          total: { $sum: '$amount' },
        },
      },
    ]);
    const revenueMap = new Map<string, number>(revenueAgg.map((r: any) => [r._id, r.total]));

    // Amount invoiced per month (all statuses, grouped by createdAt) — what was billed,
    // regardless of whether it has been paid yet.
    const invoicedAgg = await Invoice.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: '$amount' },
        },
      },
    ]);
    const invoicedMap = new Map<string, number>(invoicedAgg.map((r: any) => [r._id, r.total]));

    // Revenue collected before the range, to seed the cumulative running total.
    const [baseline] = await Invoice.aggregate([
      { $match: { status: 'paid', paidAt: { $lt: rangeStart, $ne: null } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const points: Array<{ month: string; revenue: number; invoiced: number; cumulativeRevenue: number }> = [];
    let cumulative = baseline?.total ?? 0;
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth() + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const revenue = revenueMap.get(key) ?? 0;
      cumulative += revenue;
      points.push({ month: key, revenue, invoiced: invoicedMap.get(key) ?? 0, cumulativeRevenue: cumulative });
    }

    // Outstanding (unpaid + overdue) as of now — a snapshot, not a monthly series.
    const [outstanding] = await Invoice.aggregate([
      { $match: { status: { $in: ['unpaid', 'overdue'] }, isActive: true } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      success: true,
      data: points,
      outstanding: { total: outstanding?.total ?? 0, count: outstanding?.count ?? 0 },
    });
  })
);
