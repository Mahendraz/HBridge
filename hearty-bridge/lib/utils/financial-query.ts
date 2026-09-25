import mongoose from 'mongoose';
import User from '@/models/User';

/**
 * Invoice filter for the Super Admin payment history (SA-4), shared by the
 * list endpoint and the PDF export so both always return the same rows.
 *
 * Query params:
 *   status   paid | unpaid | overdue
 *   from/to  YYYY-MM-DD, on invoice createdAt
 *   program  OT | TW | both | assessment (Invoice.therapyType)
 *   childId  one child's history
 *   search   child or parent name (case-insensitive, partial)
 */
export async function buildInvoiceQuery(params: URLSearchParams, now: Date): Promise<Record<string, unknown>> {
  const status  = params.get('status') || '';
  const from    = params.get('from') || '';
  const to      = params.get('to') || '';
  const program = params.get('program') || '';
  const childId = params.get('childId') || '';
  const search  = (params.get('search') || '').trim();

  const query: Record<string, unknown> = { isActive: { $ne: false } };
  const and: Record<string, unknown>[] = [];

  if (status === 'paid') {
    query.status = 'paid';
  } else if (status === 'unpaid') {
    query.status = 'unpaid';
    query.dueDate = { $gte: now };
  } else if (status === 'overdue') {
    and.push({ $or: [{ status: 'overdue' }, { status: 'unpaid', dueDate: { $lt: now } }] });
  }

  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.$gte = new Date(from + 'T00:00:00Z');
    if (to)   createdAt.$lte = new Date(to + 'T23:59:59Z');
    query.createdAt = createdAt;
  }

  if (['OT', 'TW', 'both', 'assessment'].includes(program)) query.therapyType = program;

  if (childId && mongoose.isValidObjectId(childId)) {
    query.childId = new mongoose.Types.ObjectId(childId);
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const parents = await User.find({ role: 'parent', name: regex }).select('_id').limit(200).lean();
    and.push({
      $or: [
        { childName: regex },
        ...(parents.length > 0 ? [{ parentId: { $in: parents.map((p) => p._id) } }] : []),
      ],
    });
  }

  if (and.length > 0) query.$and = and;
  return query;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Stored 'unpaid' past its due date is reported as 'overdue'. */
export function effectiveInvoiceStatus(status: string, dueDate: Date | string, now: Date): string {
  return status === 'unpaid' && new Date(dueDate) < now ? 'overdue' : status;
}
