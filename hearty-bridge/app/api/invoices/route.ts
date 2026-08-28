import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import TokenTransaction from '@/models/TokenTransaction';
import Child from '@/models/Child';
import mongoose from 'mongoose';

const PACKAGE_PRICES: Record<string, number> = { gold: 50000, platinum: 100000, diamond: 200000 };

/**
 * GET /api/invoices
 * Admin: all invoices (filterable by status, childId, page, limit)
 * Parent: only invoices for their own children (isVisibleToParent = true)
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const status  = params.get('status') || '';
    const childId = params.get('childId') || '';
    const page    = Math.max(1, parseInt(params.get('page')  || '1', 10));
    const limit   = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20', 10)));
    const skip    = (page - 1) * limit;

    const query: any = {};

    if (user.role === 'parent') {
      query.parentId = new mongoose.Types.ObjectId(user.userId);
      query.isVisibleToParent = true;
    } else if (user.role !== 'admin' && user.role !== 'therapist' && user.role !== 'super_admin') {
      return ErrorResponse.forbidden();
    }

    const now = new Date();

    if (status === 'paid') {
      query.status = 'paid';
    } else if (status === 'unpaid') {
      query.status = 'unpaid';
      query.dueDate = { $gte: now };
    } else if (status === 'overdue') {
      // invoices that are explicitly overdue OR still marked unpaid but past due date
      query.$or = [
        { status: 'overdue' },
        { status: 'unpaid', dueDate: { $lt: now } },
      ];
    }

    if (childId && mongoose.isValidObjectId(childId)) {
      query.childId = new mongoose.Types.ObjectId(childId);
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(query),
    ]);

    // Compute effective status: unpaid past due → overdue
    const enriched = (invoices as any[]).map((inv) => ({
      ...inv,
      status: inv.status === 'unpaid' && new Date(inv.dueDate) < now ? 'overdue' : inv.status,
    }));

    if (user.role === 'parent') {
      // Opening the invoice list counts as "seeing" any unseen invoices — clears the dashboard badge.
      await Invoice.updateMany(
        { parentId: new mongoose.Types.ObjectId(user.userId), isVisibleToParent: true, seenByParentAt: null },
        { $set: { seenByParentAt: now } }
      );
    }

    return SuccessResponse.ok({ invoices: enriched, total, page, limit });
  })
);

/**
 * POST /api/invoices
 * Admin only — manual invoice creation.
 * Body: { childId, packageTransactionId, dueDate?, notes? }
 */
export const POST = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const body = await req.json();
    const { childId, packageTransactionId, dueDate: dueDateStr, notes } = body as {
      childId: string;
      packageTransactionId: string;
      dueDate?: string;
      notes?: string;
    };

    if (!childId || !mongoose.isValidObjectId(childId)) {
      return ErrorResponse.badRequest('Invalid childId');
    }
    if (!packageTransactionId || !mongoose.isValidObjectId(packageTransactionId)) {
      return ErrorResponse.badRequest('Invalid packageTransactionId');
    }

    const [child, tx] = await Promise.all([
      Child.findOne({ _id: childId, isActive: true }).select('name parentId').lean(),
      TokenTransaction.findOne({ _id: packageTransactionId, childId: new mongoose.Types.ObjectId(childId), type: 'topup' }).lean(),
    ]);

    if (!child) return ErrorResponse.notFound('Child');
    if (!tx)    return ErrorResponse.notFound('Package transaction');
    if (!(tx as any).packageType) {
      return ErrorResponse.badRequest('Transaction is not a package topup');
    }

    const packageType = (tx as any).packageType as string;
    // TokenTransaction.therapyType is null for combined OT+TW packages.
    const therapyType = ((tx as any).therapyType as string | null) ?? 'both';
    const sessions    = (tx as any).amount as number;
    const amount      = PACKAGE_PRICES[packageType] ?? 0;

    const dueDate = dueDateStr
      ? new Date(dueDateStr + 'T00:00:00Z')
      : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })();

    // Generate invoice number based on month
    const now = new Date();
    const monthStr = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const count = await Invoice.countDocuments({ createdAt: { $gte: monthStart, $lt: monthEnd } });
    const invoiceNumber = `INV-${monthStr}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      childId:              new mongoose.Types.ObjectId(childId),
      childName:            (child as any).name,
      parentId:             (child as any).parentId,
      packageTransactionId: new mongoose.Types.ObjectId(packageTransactionId),
      packageType:          packageType,
      therapyType: therapyType as 'OT' | 'TW' | 'both' | 'assessment',
      sessions,
      amount,
      dueDate,
      status: 'unpaid',
      paidAt: null,
      isVisibleToParent: false,
      notes: notes?.trim() || '',
      adminId:   new mongoose.Types.ObjectId(user.userId),
      adminName: user.name || '',
    });

    return SuccessResponse.created({ invoice });
  })
);
