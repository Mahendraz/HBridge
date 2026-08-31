import { NextRequest } from 'next/server';
import { withAnyAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import BankAccountSettings from '@/models/BankAccountSettings';
import mongoose from 'mongoose';
import { notify } from '@/lib/utils/notify';

function getInvoiceId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  return parts[parts.length - 1] ?? '';
}

/**
 * GET /api/invoices/[id]
 * Admin: any invoice. Parent: only if parentId matches.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getInvoiceId(req);
    if (!mongoose.isValidObjectId(id)) {
      return ErrorResponse.badRequest('Invalid invoice ID');
    }

    await connectToDatabase();

    const invoice = await Invoice.findOne({ _id: id, isActive: { $ne: false } }).lean();
    if (!invoice) return ErrorResponse.notFound('Invoice');

    if (user.role === 'parent') {
      if ((invoice as any).parentId?.toString() !== user.userId) {
        return ErrorResponse.forbidden();
      }
    } else if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'therapist') {
      return ErrorResponse.forbidden();
    }

    const bankSettings = await BankAccountSettings.findOne({}).lean();
    const bankAccounts = (bankSettings?.accounts ?? [])
      .filter((acc) => acc.isActive)
      .sort((a, b) => a.order - b.order);

    return SuccessResponse.ok({ invoice, bankAccounts });
  })
);

/**
 * PATCH /api/invoices/[id]
 * Admin only.
 * Body: { dueDate?, status?, notes?, isVisibleToParent?, amount?, sessions?, packageType?, discountAmount? }
 *
 * Financial fields (amount/sessions/packageType/discountAmount) are blocked once
 * the invoice's *current* status is 'paid' — editing the amount on a receipt that's
 * already been paid would silently desync it from what was actually charged.
 *
 * Uses $set via findByIdAndUpdate to avoid full-document Mongoose validation,
 * which would fail on older documents that predate required-field additions.
 */
export const PATCH = withAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const id = getInvoiceId(req);
    if (!mongoose.isValidObjectId(id)) {
      return ErrorResponse.badRequest('Invalid invoice ID');
    }

    await connectToDatabase();

    const objectId = new mongoose.Types.ObjectId(id);
    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database not connected');

    const existing = await db.collection('invoices').findOne({ _id: objectId, isActive: { $ne: false } });
    if (!existing) return ErrorResponse.notFound('Invoice');

    const body = await req.json();
    const {
      dueDate: dueDateStr, status, notes, isVisibleToParent,
      amount, sessions, packageType, discountAmount,
    } = body as {
      dueDate?: string;
      status?: 'unpaid' | 'paid' | 'overdue';
      notes?: string;
      isVisibleToParent?: boolean;
      amount?: number;
      sessions?: number;
      packageType?: string;
      discountAmount?: number;
    };

    const editingFinancials = [amount, sessions, packageType, discountAmount].some((v) => v !== undefined);
    if (editingFinancials && existing.status === 'paid') {
      return ErrorResponse.badRequest('Invoice yang sudah lunas tidak bisa diubah nominalnya. Batalkan status lunas terlebih dahulu.');
    }

    const update: Record<string, unknown> = {};

    if (dueDateStr !== undefined) {
      const parsed = new Date(dueDateStr + 'T00:00:00Z');
      if (isNaN(parsed.getTime())) {
        return ErrorResponse.badRequest('Invalid dueDate');
      }
      update.dueDate = parsed;
    }

    if (status !== undefined) {
      const VALID = ['unpaid', 'paid', 'overdue'];
      if (!VALID.includes(status)) {
        return ErrorResponse.badRequest('Invalid status');
      }
      update.status = status;
      update.paidAt = status === 'paid' ? new Date() : null;
    }

    if (notes !== undefined) update.notes = notes.trim();
    if (isVisibleToParent !== undefined) update.isVisibleToParent = isVisibleToParent;

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount < 0) return ErrorResponse.badRequest('Invalid amount');
      update.amount = amount;
    }
    if (sessions !== undefined) {
      if (typeof sessions !== 'number' || sessions < 1) return ErrorResponse.badRequest('Invalid sessions');
      update.sessions = sessions;
    }
    if (packageType !== undefined) {
      if (typeof packageType !== 'string' || !packageType.trim()) return ErrorResponse.badRequest('Invalid packageType');
      update.packageType = packageType.trim();
    }
    if (discountAmount !== undefined) {
      if (typeof discountAmount !== 'number' || discountAmount < 0) return ErrorResponse.badRequest('Invalid discountAmount');
      update.discountAmount = discountAmount;
    }

    console.log('[PATCH invoice]', id, 'update:', JSON.stringify(update));

    // Write directly via native driver to bypass any Mongoose model-cache issue
    const writeResult = await db.collection('invoices').findOneAndUpdate(
      { _id: objectId },
      { $set: update },
      { returnDocument: 'after' }
    );

    console.log('[PATCH invoice] writeResult:', JSON.stringify(writeResult));

    if (!writeResult) return ErrorResponse.notFound('Invoice');

    // Notify the parent when an invoice newly becomes visible to them.
    if (isVisibleToParent === true && writeResult.parentId) {
      await notify({
        recipientId: writeResult.parentId,
        type: 'new_invoice',
        title: `Invoice baru: ${writeResult.invoiceNumber}`,
        body: `Invoice untuk ${writeResult.childName} sudah tersedia.`,
        link: '/dashboard/invoices',
      });
    }

    return SuccessResponse.ok({ invoice: writeResult });
  })
);

/**
 * DELETE /api/invoices/[id]
 * Admin only. Soft-delete (isActive = false). Refuses to delete an invoice that's
 * already marked paid — cancel/unmark it first, so a paid invoice never just
 * silently vanishes from someone's records.
 */
export const DELETE = withAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    const id = getInvoiceId(req);
    if (!mongoose.isValidObjectId(id)) {
      return ErrorResponse.badRequest('Invalid invoice ID');
    }

    await connectToDatabase();

    const objectId = new mongoose.Types.ObjectId(id);
    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database not connected');

    const existing = await db.collection('invoices').findOne({ _id: objectId, isActive: { $ne: false } });
    if (!existing) return ErrorResponse.notFound('Invoice');

    if (existing.status === 'paid') {
      return ErrorResponse.badRequest('Invoice yang sudah lunas tidak bisa dihapus. Batalkan status lunas terlebih dahulu.');
    }

    await db.collection('invoices').updateOne({ _id: objectId }, { $set: { isActive: false } });

    return SuccessResponse.ok({});
  })
);
