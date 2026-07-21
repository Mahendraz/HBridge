import { NextRequest } from 'next/server';
import { withAnyAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';
import Invoice from '@/models/Invoice';
import Package from '@/models/Package';
import mongoose from 'mongoose';

function getChildId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const tokensIdx = parts.indexOf('tokens');
  return tokensIdx > 0 ? parts[tokensIdx - 1] : '';
}

/**
 * GET /api/children/[id]/tokens
 * Returns current token balance and transaction history for a child.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const childId = getChildId(req);

    if (!childId || !mongoose.isValidObjectId(childId)) {
      return ErrorResponse.badRequest('Invalid child ID');
    }

    await connectToDatabase();

    const child = await Child.findOne({ _id: childId, isActive: true }).select('tokenBalance name').lean();
    if (!child) {
      return ErrorResponse.notFound('Child not found');
    }

    if (user.role === 'parent') {
      const fullChild = await Child.findOne({ _id: childId, isActive: true }).select('parentId').lean();
      if (!fullChild || (fullChild as any).parentId?.toString() !== user.userId) {
        return ErrorResponse.forbidden();
      }
    }

    const transactions = await TokenTransaction.find({ childId: new mongoose.Types.ObjectId(childId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return SuccessResponse.ok({
      data: {
        balance: (child as any).tokenBalance ?? 0,
        transactions,
      },
    });
  })
);

/**
 * POST /api/children/[id]/tokens
 * Admin / Super Admin only. Two modes:
 *
 * 1. Assign package:  { packageId: '<Package ObjectId>' }
 *    - Looks up Package from DB → gets sessions, price, name, therapyType
 *    - Auto-generates Invoice record
 *
 * 2. Manual deduct:  { type: 'deduct', amount: number, note?: string }
 *    - Subtracts tokens without generating sessions (manual override)
 */
export const POST = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const childId = getChildId(req);

    if (!childId || !mongoose.isValidObjectId(childId)) {
      return ErrorResponse.badRequest('Invalid child ID');
    }

    const body = await req.json();

    // ── Manual deduct path ──
    if (body.type === 'deduct') {
      const parsedAmount = Math.floor(Number(body.amount ?? 1));
      if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
        return ErrorResponse.badRequest('amount must be ≥ 1');
      }
      await connectToDatabase();
      const child = await Child.findOne({ _id: childId, isActive: true });
      if (!child) return ErrorResponse.notFound('Child not found');
      const balanceBefore = child.tokenBalance ?? 0;
      if (balanceBefore - parsedAmount < 0) {
        return ErrorResponse.badRequest('Saldo tidak mencukupi');
      }
      child.tokenBalance = balanceBefore - parsedAmount;
      await child.save();
      const tx = await TokenTransaction.create({
        childId: new mongoose.Types.ObjectId(childId),
        childName: child.name,
        adminId: new mongoose.Types.ObjectId(user.userId),
        adminName: user.name || '',
        type: 'deduct',
        packageType: null,
        packageId: null,
        amount: parsedAmount,
        balanceBefore,
        balanceAfter: child.tokenBalance,
        note: (body.note as string | undefined)?.trim() || 'Pengurangan manual',
      });
      return SuccessResponse.created({ data: { transaction: tx, newBalance: child.tokenBalance } });
    }

    // ── Package assignment path ──
    const { packageId, discountAmount: rawDiscount } = body as { packageId?: string; discountAmount?: number };

    if (!packageId || !mongoose.isValidObjectId(packageId)) {
      return ErrorResponse.badRequest('packageId harus berisi ID paket yang valid');
    }

    await connectToDatabase();

    const [child, pkg] = await Promise.all([
      Child.findOne({ _id: childId, isActive: true }),
      Package.findById(packageId).lean(),
    ]);

    if (!child) return ErrorResponse.notFound('Child not found');
    if (!pkg)   return ErrorResponse.notFound('Package not found');
    if (!(pkg as any).isActive) {
      return ErrorResponse.badRequest('Paket ini sudah tidak aktif');
    }

    const packageDoc  = pkg as any;
    const amount      = packageDoc.sessions as number;
    const packageName = packageDoc.name as string;
    const therapyType = packageDoc.therapyType as string;
    const price       = packageDoc.price as number;

    const discount   = Math.min(Math.max(0, Math.round(Number(rawDiscount) || 0)), price);
    const finalPrice = price - discount;

    const balanceBefore = child.tokenBalance ?? 0;
    const balanceAfter  = balanceBefore + amount;

    child.tokenBalance = balanceAfter;
    await child.save();

    const txTherapyType = therapyType === 'both' ? null : (therapyType as 'OT' | 'TW');
    const transaction = await TokenTransaction.create({
      childId:    new mongoose.Types.ObjectId(childId),
      childName:  child.name,
      adminId:    new mongoose.Types.ObjectId(user.userId),
      adminName:  user.name || '',
      type:          'topup' as const,
      packageType:   packageName,
      packageId:     new mongoose.Types.ObjectId(packageId),
      therapyType:   txTherapyType,
      amount,
      originalPrice: price,
      discountAmount: discount,
      finalPrice,
      balanceBefore,
      balanceAfter,
      note: `Paket ${packageName} (${amount} sesi)${discount > 0 ? ` - Diskon Rp ${discount.toLocaleString('id-ID')}` : ''}`,
    }) as any;

    // Auto-create invoice
    const now       = new Date();
    const monthStr  = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const invoiceCount  = await Invoice.countDocuments({ createdAt: { $gte: monthStart, $lt: monthEnd } });
    const invoiceNumber = `INV-${monthStr}-${String(invoiceCount + 1).padStart(4, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    await Invoice.create({
      invoiceNumber,
      childId:              new mongoose.Types.ObjectId(childId),
      childName:            child.name,
      parentId:             child.parentId,
      packageTransactionId: transaction._id,
      packageId:            new mongoose.Types.ObjectId(packageId),
      packageType:          packageName,
      therapyType:          therapyType === 'both' ? 'OT' : (therapyType as 'OT' | 'TW'),
      sessions:             amount,
      originalAmount:       price,
      discountAmount:       discount,
      amount:               finalPrice,
      dueDate,
      status:               'unpaid',
      paidAt:               null,
      isVisibleToParent:    false,
      notes:                '',
      adminId:              new mongoose.Types.ObjectId(user.userId),
      adminName:            user.name || '',
    });

    return SuccessResponse.created({
      data: { transaction, newBalance: balanceAfter, packageName, totalSessions: amount },
    });
  })
);
