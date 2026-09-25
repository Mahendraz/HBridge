import { NextRequest } from 'next/server';
import { withAnyAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import BankAccountSettings from '@/models/BankAccountSettings';
import mongoose from 'mongoose';
import { notify } from '@/lib/utils/notify';
import { applyInvoicePackageChange } from '@/lib/utils/invoice-package';
import { withOptionalTransaction } from '@/lib/db/transaction';

class InvoiceGoneError extends Error {}

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
 * Body: { dueDate?, status?, notes?, isVisibleToParent?, packageId? }
 *
 * The package is picked from the Package list (ADM-2): price and session count
 * always follow it and can't be typed in. Changing it also updates the package
 * TokenTransaction, Child.tokenBalance and the package's schedule — see
 * applyInvoicePackageChange.
 *
 * A paid invoice is locked: only its status (to undo a mistaken "lunas") and
 * visibility to the parent can still change.
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
    const { dueDate: dueDateStr, status, notes, isVisibleToParent, packageId } = body as {
      dueDate?: string;
      status?: 'unpaid' | 'paid' | 'overdue';
      notes?: string;
      isVisibleToParent?: boolean;
      packageId?: string;
    };

    const editingContent = [dueDateStr, notes, packageId].some((v) => v !== undefined);
    if (editingContent && existing.status === 'paid') {
      return ErrorResponse.badRequest('Invoice yang sudah lunas tidak bisa diedit.');
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

    const currentPackageId = existing.packageId?.toString() ?? null;
    const changingPackage = packageId !== undefined && packageId !== currentPackageId;

    // A package change touches the TokenTransaction, Child.tokenBalance, the
    // package's Sessions and the invoice — one transaction, so a failure part
    // way through leaves nothing half-applied. Retries re-run the whole block.
    const outcome = await withOptionalTransaction(async (session) => {
      const fullUpdate: Record<string, unknown> = { ...update };
      if (changingPackage) {
        const change = await applyInvoicePackageChange(
          {
            childId: existing.childId,
            packageTransactionId: existing.packageTransactionId,
            therapyType: existing.therapyType,
            discountAmount: existing.discountAmount,
          },
          packageId as string
        );
        // Validation errors are raised before anything is written.
        if ('error' in change) return { error: change.error, invoice: null };
        Object.assign(fullUpdate, change.update);
      }

      console.log('[PATCH invoice]', id, 'update:', JSON.stringify(fullUpdate));

      // Write directly via native driver to bypass any Mongoose model-cache issue.
      // The native driver doesn't read the async-local session, so pass it.
      const invoice = await db.collection('invoices').findOneAndUpdate(
        { _id: objectId },
        { $set: fullUpdate },
        { returnDocument: 'after', session }
      );
      // Abort (roll back the package changes) if the invoice vanished meanwhile.
      if (!invoice) throw new InvoiceGoneError();
      return { error: null, invoice };
    }).catch((err) => {
      if (err instanceof InvoiceGoneError) return { error: null, invoice: null };
      throw err;
    });

    if (outcome.error) return ErrorResponse.badRequest(outcome.error);
    const writeResult = outcome.invoice;

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
