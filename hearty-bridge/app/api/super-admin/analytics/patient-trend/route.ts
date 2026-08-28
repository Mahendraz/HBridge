import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';

/**
 * GET /api/super-admin/analytics/patient-trend?months=12
 * New patients per month + cumulative active-patient count, for the trend chart.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    if (!['admin', 'super_admin'].includes(user.role)) {
      return ErrorResponse.forbidden('Anda tidak memiliki akses analitik');
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const months = Math.min(36, Math.max(1, parseInt(url.searchParams.get('months') || '12', 10)));

    const now = new Date();
    const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

    // New patients registered per month, within the range.
    const newPatientsAgg = await Child.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const newPatientsMap = new Map<string, number>(newPatientsAgg.map((r: any) => [r._id, r.count]));

    // Active-patient count as of the start of the range, to seed the running total
    // (children created before rangeStart that are still active).
    const baselineCount = await Child.countDocuments({ createdAt: { $lt: rangeStart }, isActive: true });

    // Children deactivated per month, so the cumulative line can go down too
    // (best-effort: uses updatedAt as a proxy for "deactivated this month" — the
    // schema has no deactivatedAt field, and isActive is the only signal we have).
    const deactivatedAgg = await Child.aggregate([
      { $match: { isActive: false, updatedAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
          count: { $sum: 1 },
        },
      },
    ]);
    const deactivatedMap = new Map<string, number>(deactivatedAgg.map((r: any) => [r._id, r.count]));

    const points: Array<{ month: string; newPatients: number; activePatientsCumulative: number }> = [];
    let cumulative = baselineCount;
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth() + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const newPatients = newPatientsMap.get(key) ?? 0;
      cumulative += newPatients - (deactivatedMap.get(key) ?? 0);
      points.push({ month: key, newPatients, activePatientsCumulative: Math.max(0, cumulative) });
    }

    return NextResponse.json({ success: true, data: points });
  })
);
