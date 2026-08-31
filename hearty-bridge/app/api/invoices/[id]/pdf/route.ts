import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';
import { withErrorHandling, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import BankAccountSettings from '@/models/BankAccountSettings';
import mongoose from 'mongoose';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoicePdfDocument, type InvoicePdfData } from '@/components/invoices/invoice-pdf-template';

function getInvoiceId(req: NextRequest): string {
  const parts = new URL(req.url).pathname.split('/');
  const idx = parts.indexOf('invoices');
  return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : '';
}

/**
 * GET /api/invoices/[id]/pdf
 * Same access rule as GET /api/invoices/[id]: admin/therapist/super_admin can access
 * any invoice, parent only their own.
 */
export const GET = withAnyAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const id = getInvoiceId(req);
    if (!mongoose.isValidObjectId(id)) return ErrorResponse.badRequest('Invalid invoice ID');

    await connectToDatabase();

    const invoice = await Invoice.findOne({ _id: id, isActive: { $ne: false } }).lean();
    if (!invoice) return ErrorResponse.notFound('Invoice');

    if (user.role === 'parent') {
      if ((invoice as any).parentId?.toString() !== user.userId) return ErrorResponse.forbidden();
    } else if (!['admin', 'super_admin', 'therapist'].includes(user.role)) {
      return ErrorResponse.forbidden();
    }

    const parent = await User.findById((invoice as any).parentId).select('name').lean();

    const bankSettings = await BankAccountSettings.findOne({}).lean();
    const bankAccounts = (bankSettings?.accounts ?? [])
      .filter((acc) => acc.isActive)
      .sort((a, b) => a.order - b.order)
      .map((acc) => ({
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        accountHolderName: acc.accountHolderName,
        notes: acc.notes,
      }));

    const data: InvoicePdfData = {
      invoiceNumber: (invoice as any).invoiceNumber,
      childName: (invoice as any).childName,
      parentName: (parent as any)?.name ?? '—',
      packageType: (invoice as any).packageType,
      therapyType: (invoice as any).therapyType,
      sessions: (invoice as any).sessions,
      originalAmount: (invoice as any).originalAmount || (invoice as any).amount,
      discountAmount: (invoice as any).discountAmount || 0,
      amount: (invoice as any).amount,
      dueDate: (invoice as any).dueDate,
      status: (invoice as any).status,
      paidAt: (invoice as any).paidAt,
      createdAt: (invoice as any).createdAt,
      notes: (invoice as any).notes,
      bankAccounts,
    };

    const buffer = await renderToBuffer(InvoicePdfDocument({ invoice: data }));

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${data.invoiceNumber}.pdf"`,
      },
    });
  })
);
