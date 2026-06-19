import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import TokenTransaction from '@/models/TokenTransaction';
import mongoose from 'mongoose';

function getChildId(req: NextRequest): string {
  // URL pattern: /api/children/[id]/tokens
  const parts = new URL(req.url).pathname.split('/');
  const tokensIdx = parts.indexOf('tokens');
  return tokensIdx > 0 ? parts[tokensIdx - 1] : '';
}

/**
 * GET /api/children/[id]/tokens
 * Returns current token balance and transaction history for a child.
 * Accessible by all authenticated roles.
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

    // Role-based access: parent can only see their own child
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
 * Top-up or deduct tokens for a child.
 * Admin only.
 * Body: { type: 'topup' | 'deduct', amount: number, note?: string }
 */
export const POST = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const childId = getChildId(req);

    if (!childId || !mongoose.isValidObjectId(childId)) {
      return ErrorResponse.badRequest('Invalid child ID');
    }

    const body = await req.json();
    const { type, amount, note } = body as {
      type: string;
      amount: number;
      note?: string;
    };

    if (type !== 'topup' && type !== 'deduct') {
      return ErrorResponse.badRequest('type must be "topup" or "deduct"');
    }

    const parsedAmount = Math.floor(Number(amount));
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      return ErrorResponse.badRequest('amount must be an integer ≥ 1');
    }

    await connectToDatabase();

    const child = await Child.findOne({ _id: childId, isActive: true });
    if (!child) {
      return ErrorResponse.notFound('Child not found');
    }

    const balanceBefore = child.tokenBalance ?? 0;

    if (type === 'deduct' && balanceBefore - parsedAmount < 0) {
      return ErrorResponse.badRequest('Saldo tidak mencukupi');
    }

    const balanceAfter =
      type === 'topup' ? balanceBefore + parsedAmount : balanceBefore - parsedAmount;

    child.tokenBalance = balanceAfter;
    await child.save();

    const transaction = await TokenTransaction.create({
      childId: new mongoose.Types.ObjectId(childId),
      childName: child.name,
      adminId: new mongoose.Types.ObjectId(user.userId),
      adminName: user.name || '',
      type,
      amount: parsedAmount,
      balanceBefore,
      balanceAfter,
      note: note?.trim() || '',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          transaction,
          newBalance: balanceAfter,
        },
      },
      { status: 201 }
    );
  })
);
