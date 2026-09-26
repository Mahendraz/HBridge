/**
 * Row shape + formatting for the payment history export (SA-4). Pure — used
 * by the browser (CSV / Excel) and by the PDF route, so all three formats
 * carry the same columns and values.
 */

export interface PaymentHistoryRow {
  invoiceNumber: string;
  createdAt: string;
  childName: string;
  parentName: string;
  packageType: string;
  program: string;
  sessions: number;
  amount: number;
  status: string;
  paidAt: string;
}

export const PAYMENT_HISTORY_COLUMNS: Array<{ key: keyof PaymentHistoryRow; label: string }> = [
  { key: 'invoiceNumber', label: 'No. Invoice' },
  { key: 'createdAt', label: 'Tanggal' },
  { key: 'childName', label: 'Anak' },
  { key: 'parentName', label: 'Orang Tua' },
  { key: 'packageType', label: 'Paket' },
  { key: 'program', label: 'Program' },
  { key: 'sessions', label: 'Sesi' },
  { key: 'amount', label: 'Jumlah (Rp)' },
  { key: 'status', label: 'Status' },
  { key: 'paidAt', label: 'Tgl Bayar' },
];

const STATUS_LABEL: Record<string, string> = { unpaid: 'Belum Bayar', paid: 'Lunas', overdue: 'Jatuh Tempo' };
export const PROGRAM_LABEL: Record<string, string> = { OT: 'OT', TW: 'TW', both: 'OT & TW', assessment: 'Asesmen' };

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface InvoiceLike {
  invoiceNumber: string;
  createdAt: string | Date;
  childName: string;
  parentId?: { name?: string } | string | null;
  packageType: string;
  therapyType: string;
  sessions: number;
  amount: number;
  status: string;
  paidAt?: string | Date | null;
}

/** `status` must already be the effective one (unpaid past due → overdue). */
export function toPaymentHistoryRows(invoices: InvoiceLike[]): PaymentHistoryRow[] {
  return invoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    createdAt: formatDate(inv.createdAt),
    childName: inv.childName,
    parentName: typeof inv.parentId === 'object' && inv.parentId ? inv.parentId.name ?? '' : '',
    packageType: inv.packageType,
    program: PROGRAM_LABEL[inv.therapyType] ?? inv.therapyType,
    sessions: inv.sessions,
    amount: inv.amount,
    status: STATUS_LABEL[inv.status] ?? inv.status,
    paidAt: inv.status === 'paid' ? formatDate(inv.paidAt) : '',
  }));
}

export function paymentHistoryToCsv(rows: PaymentHistoryRow[]): string {
  // Text starting with = + - @ (or tab/CR) would be run as a formula by
  // Excel/Sheets; a leading apostrophe makes it plain text. Numbers pass as is.
  const neutralize = (v: string | number) =>
    typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v);
  const escape = (v: string | number) => `"${neutralize(v).replace(/"/g, '""')}"`;
  const header = PAYMENT_HISTORY_COLUMNS.map((c) => escape(c.label)).join(',');
  const lines = rows.map((r) => PAYMENT_HISTORY_COLUMNS.map((c) => escape(r[c.key])).join(','));
  // BOM so Excel opens the UTF-8 CSV with the right encoding.
  return '﻿' + [header, ...lines].join('\n');
}

export function paymentHistoryToSheet(rows: PaymentHistoryRow[]): Array<Array<string | number>> {
  return [
    PAYMENT_HISTORY_COLUMNS.map((c) => c.label),
    ...rows.map((r) => PAYMENT_HISTORY_COLUMNS.map((c) => r[c.key])),
  ];
}
