import { NextRequest } from 'next/server';
import { withSuperAdminAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import BankAccountSettings from '@/models/BankAccountSettings';
import mongoose from 'mongoose';
import { z } from 'zod';

const bankAccountSchema = z.object({
  bankName: z.string().min(1).max(100).trim(),
  accountNumber: z.string().min(1).max(50).trim(),
  accountHolderName: z.string().min(1).max(100).trim(),
  notes: z.string().max(300).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

const bodySchema = z.object({
  accounts: z.array(bankAccountSchema),
});

/**
 * GET /api/super-admin/bank-accounts
 * Admin + Super Admin. Returns the single bank account settings document
 * (empty accounts array if none has been configured yet).
 */
export const GET = withAdminAuth(
  withErrorHandling(async () => {
    await connectToDatabase();

    const settings = await BankAccountSettings.findOne({}).lean();

    return SuccessResponse.ok({ accounts: settings?.accounts ?? [] });
  })
);

/**
 * PUT /api/super-admin/bank-accounts
 * Super Admin only. Replaces the full list of bank accounts.
 * Body: { accounts: BankAccount[] }
 */
export const PUT = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    await connectToDatabase();

    const body = await req.json();
    const result = bodySchema.safeParse(body);
    if (!result.success) {
      return ErrorResponse.badRequest('Invalid input', 'VALIDATION_ERROR', result.error.issues);
    }

    const accounts = result.data.accounts.map((acc, index) => ({
      ...acc,
      notes: acc.notes || '',
      isActive: acc.isActive ?? true,
      order: acc.order ?? index,
    }));

    const settings = await BankAccountSettings.findOneAndUpdate(
      {},
      {
        accounts,
        updatedBy: new mongoose.Types.ObjectId(user.userId),
        updatedByName: user.name || '',
      },
      { upsert: true, new: true }
    );

    return SuccessResponse.ok({ accounts: settings.accounts });
  })
);
