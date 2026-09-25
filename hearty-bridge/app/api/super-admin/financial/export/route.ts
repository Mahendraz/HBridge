import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Invoice from '@/models/Invoice';
import Child from '@/models/Child';
import mongoose from 'mongoose';
import { renderToBuffer } from '@react-pdf/renderer';
import { buildInvoiceQuery, effectiveInvoiceStatus } from '@/lib/utils/financial-query';
import { toPaymentHistoryRows, PROGRAM_LABEL } from '@/lib/utils/payment-history-export';
import { PaymentHistoryPdfDocument } from '@/components/invoices/payment-history-pdf';

const EXPORT_LIMIT = 5000;

interface ExportInvoice {
  invoiceNumber: string;
  createdAt: Date;
  childName: string;
  parentId: { name?: string } | null;
  packageType: string;
  therapyType: string;
  sessions: number;
  amount: number;
  status: string;
  dueDate: Date;
  paidAt: Date | null;
}

const STATUS_FILTER_LABEL: Record<string, string> = { paid: 'Lunas', unpaid: 'Belum Bayar', overdue: 'Jatuh Tempo' };

/**
 * GET /api/super-admin/financial/export
 * Super Admin only. Payment history as PDF (SA-4), same filters as
 * GET /api/super-admin/financial. CSV and Excel are built in the browser from
 * that endpoint's ?all=1 response.
 */
export const GET = withSuperAdminAuth(
  withErrorHandling(async (req: NextRequest) => {
    await connectToDatabase();

    const params = new URL(req.url).searchParams;
    const now = new Date();
    const query = await buildInvoiceQuery(params, now);

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(EXPORT_LIMIT)
      .populate('parentId', 'name')
      .lean<ExportInvoice[]>();

    const rows = toPaymentHistoryRows(
      invoices.map((inv) => ({ ...inv, status: effectiveInvoiceStatus(inv.status, inv.dueDate, now) }))
    );
    const paidAmount = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount ?? 0), 0);
    const unpaidAmount = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.amount ?? 0), 0);

    // Human-readable description of the active filters for the PDF header.
    const parts: string[] = [];
    const childId = params.get('childId');
    if (childId && mongoose.isValidObjectId(childId)) {
      const child = await Child.findById(childId).select('name').lean<{ name: string }>();
      if (child) parts.push(`Anak: ${child.name}`);
    }
    if (params.get('search')) parts.push(`Cari: "${params.get('search')}"`);
    if (params.get('status')) parts.push(`Status: ${STATUS_FILTER_LABEL[params.get('status')!] ?? params.get('status')}`);
    if (params.get('program')) parts.push(`Program: ${PROGRAM_LABEL[params.get('program')!] ?? params.get('program')}`);
    if (params.get('from') || params.get('to')) parts.push(`Periode: ${params.get('from') || '…'} s/d ${params.get('to') || '…'}`);

    const buffer = await renderToBuffer(
      PaymentHistoryPdfDocument({
        data: {
          filterSummary: parts.length > 0 ? parts.join(' · ') : 'Semua invoice',
          generatedAt: now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }),
          paidAmount,
          unpaidAmount,
          rows,
        },
      })
    );

    const stamp = now.toISOString().slice(0, 10);
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Riwayat-Pembayaran-${stamp}.pdf"`,
      },
    });
  })
);
