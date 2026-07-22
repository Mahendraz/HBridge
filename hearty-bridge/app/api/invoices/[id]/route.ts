import { NextRequest } from 'next/server';
import { withAnyAuth, withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import mongoose from 'mongoose';

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

    const invoice = await Invoice.findById(id).lean();
    if (!invoice) return ErrorResponse.notFound('Invoice');

    if (user.role === 'parent') {
      if ((invoice as any).parentId?.toString() !== user.userId) {
        return ErrorResponse.forbidden();
      }
    } else if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'therapist') {
      return ErrorResponse.forbidden();
    }

    return SuccessResponse.ok({ invoice });
  })
);

/**
 * PATCH /api/invoices/[id]
 * Admin only.
 * Body: { dueDate?, status?, notes?, isVisibleToParent? }
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

    const body = await req.json();
    const { dueDate: dueDateStr, status, notes, isVisibleToParent } = body as {
      dueDate?: string;
      status?: 'unpaid' | 'paid' | 'overdue';
      notes?: string;
      isVisibleToParent?: boolean;
    };

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

    console.log('[PATCH invoice]', id, 'update:', JSON.stringify(update));

    // Write directly via native driver to bypass any Mongoose model-cache issue
    const objectId = new mongoose.Types.ObjectId(id);
    const db = mongoose.connection.db;
    if (!db) return ErrorResponse.internalServerError('Database not connected');

    const writeResult = await db.collection('invoices').findOneAndUpdate(
      { _id: objectId },
      { $set: update },
      { returnDocument: 'after' }
    );

    console.log('[PATCH invoice] writeResult:', JSON.stringify(writeResult));

    if (!writeResult) return ErrorResponse.notFound('Invoice');

    return SuccessResponse.ok({ invoice: writeResult });
  })
);
