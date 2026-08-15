"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import {
  ReceiptIcon, CalendarIcon, CheckCircleIcon,
  XCircleIcon, ClockIcon, EyeIcon, EyeOffIcon, FilterIcon,
  UploadCloudIcon, MessageSquareIcon, X, FileImageIcon,
} from "lucide-react";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  childName: string;
  packageType: 'gold' | 'platinum' | 'diamond';
  therapyType: 'OT' | 'TW';
  sessions: number;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'overdue';
  paidAt: string | null;
  isVisibleToParent: boolean;
  notes: string;
  adminName: string;
  paymentProofKey?: string | null;
  paymentMessage?: string;
  paymentSubmittedAt?: string | null;
  createdAt: string;
}

const PACKAGE_LABEL: Record<string, string> = { gold: 'Gold', platinum: 'Platinum', diamond: 'Diamond' };
const PACKAGE_COLOR: Record<string, string> = {
  gold:     'bg-yellow-100 text-yellow-800',
  platinum: 'bg-gray-100 text-gray-700',
  diamond:  'bg-blue-100 text-blue-800',
};
const THERAPY_COLOR: Record<string, string> = {
  OT: 'bg-blue-50 text-blue-700',
  TW: 'bg-purple-50 text-purple-700',
};

function StatusBadge({ status }: { status: Invoice['status'] }) {
  if (status === 'paid') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <CheckCircleIcon className="h-3 w-3" /> Lunas
    </span>
  );
  if (status === 'overdue') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <XCircleIcon className="h-3 w-3" /> Jatuh Tempo
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
      <ClockIcon className="h-3 w-3" /> Belum Dibayar
    </span>
  );
}

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const isAdmin = permissions.hasPermission('invoices:manage');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentText, setPaymentText] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<{ url: string; message: string; invoiceNumber: string } | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user, fetchInvoices]);

  const patch = async (id: string, body: object): Promise<any> => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    console.log('[invoice PATCH]', id, body, '→ status:', res.status, 'body:', data);
    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    return data;
  };

  const handleToggleVisibility = async (inv: Invoice) => {
    const newVal = !inv.isVisibleToParent;
    setSavingId(inv._id);
    setError(null);
    try {
      const result = await patch(inv._id, { isVisibleToParent: newVal });
      // Use server-confirmed value, fall back to local toggle
      const confirmed = result?.invoice?.isVisibleToParent ?? newVal;
      setInvoices(prev =>
        prev.map(i => i._id === inv._id ? { ...i, isVisibleToParent: confirmed } : i)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkPaid = async (inv: Invoice) => {
    const newStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
    setSavingId(inv._id + '_status');
    setError(null);
    try {
      const result = await patch(inv._id, { status: newStatus });
      const confirmedStatus = result?.invoice?.status ?? newStatus;
      const confirmedPaidAt = result?.invoice?.paidAt ?? (newStatus === 'paid' ? new Date().toISOString() : null);
      setInvoices(prev =>
        prev.map(i => i._id === inv._id
          ? { ...i, status: confirmedStatus, paidAt: confirmedPaidAt }
          : i)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveDueDate = async (invoiceId: string) => {
    if (!editDueDate) return;
    setSavingId(invoiceId);
    setError(null);
    try {
      const result = await patch(invoiceId, { dueDate: editDueDate });
      const confirmedDate = result?.invoice?.dueDate ?? (editDueDate + 'T00:00:00.000Z');
      setInvoices(prev =>
        prev.map(i => i._id === invoiceId ? { ...i, dueDate: confirmedDate } : i)
      );
      setEditingId(null);
      setEditDueDate('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setSavingId(null);
    }
  };

  const handleSubmitPayment = async (invoiceId: string) => {
    if (!paymentFile) return;
    setUploadingId(invoiceId);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', paymentFile);
      fd.append('message', paymentText);
      const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal mengirim bukti');
      setInvoices(prev => prev.map(i => i._id === invoiceId
        ? { ...i, paymentSubmittedAt: new Date().toISOString(), paymentMessage: paymentText }
        : i
      ));
      setExpandedPaymentId(null);
      setPaymentFile(null);
      setPaymentText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setUploadingId(null);
    }
  };

  const handleViewProof = async (invoiceId: string, invoiceNumber: string) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal mendapatkan bukti');
      if (data?.url) setProofModal({ url: data.url, message: data.message ?? '', invoiceNumber });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuka bukti');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat invoice...</p>
        </div>
      </div>
    );
  }

  // ── Parent view ──────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Saya</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rincian tagihan paket terapi anak Anda</p>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <ReceiptIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">Belum ada invoice</p>
            <p className="text-sm text-gray-400 mt-1">Invoice akan muncul setelah dikirimkan oleh admin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => (
              <div key={inv._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">{inv.invoiceNumber}</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{inv.childName}</p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PACKAGE_COLOR[inv.packageType]}`}>
                    {PACKAGE_LABEL[inv.packageType]}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${THERAPY_COLOR[inv.therapyType]}`}>
                    {inv.therapyType}
                  </span>
                  <span className="text-xs text-gray-500">{inv.sessions} sesi</span>
                </div>

                <div className="rounded-lg bg-teal-50 px-4 py-3 mb-4 text-center">
                  <p className="text-2xl font-bold text-teal-700">{formatRupiah(inv.amount)}</p>
                  <p className="text-xs text-teal-600 mt-0.5">Total Tagihan</p>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    Jatuh tempo:
                    <span className="font-medium text-gray-700 ml-1">{formatDate(inv.dueDate)}</span>
                  </span>
                  <span>Dibuat {formatDate(inv.createdAt)}</span>
                </div>

                {inv.status === 'paid' && inv.paidAt && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircleIcon className="h-3 w-3" />
                    Dibayar pada {formatDate(inv.paidAt)}
                  </p>
                )}

                {inv.notes && (
                  <p className="text-xs text-gray-400 mt-2 italic">{inv.notes}</p>
                )}

                {/* Payment proof section */}
                {inv.status !== 'paid' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {inv.paymentSubmittedAt ? (
                      <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                          <ClockIcon className="h-3.5 w-3.5" /> Menunggu Konfirmasi Admin
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">Dikirim {formatDate(inv.paymentSubmittedAt)}</p>
                        {inv.paymentMessage && (
                          <p className="text-xs text-amber-500 italic mt-1">"{inv.paymentMessage}"</p>
                        )}
                      </div>
                    ) : expandedPaymentId === inv._id ? (
                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                          <UploadCloudIcon className="h-3.5 w-3.5 text-teal-600" /> Upload Bukti Transfer
                        </p>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setPaymentFile(e.target.files?.[0] ?? null)}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                        />
                        <textarea
                          value={paymentText}
                          onChange={(e) => setPaymentText(e.target.value)}
                          placeholder="Pesan opsional (nama bank, nama pengirim, catatan...)"
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSubmitPayment(inv._id)}
                            disabled={!paymentFile || uploadingId === inv._id}
                            className="flex-1 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-40 transition-colors"
                          >
                            {uploadingId === inv._id ? 'Mengirim...' : 'Kirim Bukti'}
                          </button>
                          <button
                            onClick={() => { setExpandedPaymentId(null); setPaymentFile(null); setPaymentText(''); }}
                            className="px-3 py-2 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setExpandedPaymentId(inv._id)}
                        className="w-full py-2 border-2 border-dashed border-teal-300 rounded-lg text-xs font-semibold text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <UploadCloudIcon className="h-3.5 w-3.5" />
                        Upload Bukti Transfer
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Admin view ───────────────────────────────────────────────────────────────
  const displayed = invoices.filter((inv) => {
    if (visibilityFilter === 'sent')   return inv.isVisibleToParent;
    if (visibilityFilter === 'unsent') return !inv.isVisibleToParent;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Invoicing</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Atur tanggal pembayaran dan kirimkan invoice ke orang tua
        </p>
      </div>

      {/* Summary count cards only — no revenue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoice',   value: invoices.length,                                        color: 'text-gray-900' },
          { label: 'Belum Dikirim',   value: invoices.filter(i => !i.isVisibleToParent).length,      color: 'text-orange-600' },
          { label: 'Sudah Dikirim',   value: invoices.filter(i => i.isVisibleToParent).length,       color: 'text-teal-700' },
          { label: 'Lunas',           value: invoices.filter(i => i.status === 'paid').length,        color: 'text-green-700' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Status:</span>
          {(['all', 'unpaid', 'paid', 'overdue'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Semua' : s === 'unpaid' ? 'Belum Bayar' : s === 'paid' ? 'Lunas' : 'Jatuh Tempo'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Kirim ke orang tua:</span>
          {(['all', 'sent', 'unsent'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVisibilityFilter(v)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                visibilityFilter === v ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {v === 'all' ? 'Semua' : v === 'sent' ? 'Sudah Dikirim' : 'Belum Dikirim'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Invoice table */}
      {displayed.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
          <ReceiptIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">Tidak ada invoice</p>
          <p className="text-sm text-gray-400 mt-1">Invoice akan otomatis dibuat saat paket ditetapkan ke pasien</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">No. Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pasien</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paket</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jatuh Tempo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bukti Bayar</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kirim ke Orang Tua</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((inv) => (
                  <tr key={inv._id} className={`hover:bg-gray-50 transition-colors ${inv.isVisibleToParent ? '' : 'opacity-75'}`}>
                    {/* No. Invoice */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-gray-600">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.createdAt)}</p>
                    </td>

                    {/* Pasien */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{inv.childName}</p>
                    </td>

                    {/* Paket */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PACKAGE_COLOR[inv.packageType]}`}>
                          {PACKAGE_LABEL[inv.packageType]}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${THERAPY_COLOR[inv.therapyType]}`}>
                          {inv.therapyType}
                        </span>
                        <span className="text-xs text-gray-400">{inv.sessions} sesi</span>
                      </div>
                    </td>

                    {/* Harga */}
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-gray-900">{formatRupiah(inv.amount)}</p>
                    </td>

                    {/* Jatuh Tempo */}
                    <td className="px-4 py-3">
                      {editingId === inv._id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => handleSaveDueDate(inv._id)}
                            disabled={!editDueDate || savingId === inv._id}
                            className="px-2 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 disabled:opacity-40"
                          >
                            {savingId === inv._id ? '...' : 'Simpan'}
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditDueDate(''); }}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(inv._id);
                            setEditDueDate(inv.dueDate.split('T')[0]);
                          }}
                          className="text-left group"
                        >
                          <p className="text-sm text-gray-700 group-hover:text-teal-600 transition-colors">
                            {formatDate(inv.dueDate)}
                          </p>
                          <p className="text-xs text-gray-400 group-hover:text-teal-500">Klik untuk ubah</p>
                        </button>
                      )}
                    </td>

                    {/* Status + mark paid */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge status={inv.status} />
                        {inv.status !== 'paid' ? (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            disabled={savingId === inv._id + '_status'}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40 transition-colors"
                          >
                            {savingId === inv._id + '_status'
                              ? <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              : <CheckCircleIcon className="h-3 w-3" />
                            }
                            Tandai Lunas
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkPaid(inv)}
                            disabled={savingId === inv._id + '_status'}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                          >
                            {savingId === inv._id + '_status'
                              ? <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              : <XCircleIcon className="h-3 w-3" />
                            }
                            Batalkan
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Bukti Bayar */}
                    <td className="px-4 py-3">
                      {inv.paymentSubmittedAt ? (
                        <div className="space-y-1">
                          <button
                            onClick={() => handleViewProof(inv._id, inv.invoiceNumber)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <FileImageIcon className="h-3 w-3" /> Lihat Bukti
                          </button>
                          <p className="text-xs text-gray-400">{formatDate(inv.paymentSubmittedAt)}</p>
                          {inv.paymentMessage && (
                            <p className="text-xs text-gray-500 italic max-w-[140px] truncate" title={inv.paymentMessage}>
                              <MessageSquareIcon className="h-3 w-3 inline mr-0.5" />{inv.paymentMessage}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Kirim ke Orang Tua toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVisibility(inv)}
                        disabled={savingId === inv._id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 ${
                          inv.isVisibleToParent
                            ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {savingId === inv._id ? (
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : inv.isVisibleToParent ? (
                          <><EyeIcon className="h-3 w-3" /> Terkirim</>
                        ) : (
                          <><EyeOffIcon className="h-3 w-3" /> Kirim</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment proof modal */}
      {proofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setProofModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-mono">{proofModal.invoiceNumber}</p>
                <p className="font-semibold text-gray-900 text-sm mt-0.5">Bukti Pembayaran</p>
              </div>
              <button
                onClick={() => setProofModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message (if any) */}
            {proofModal.message && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-xs text-amber-700">
                  <MessageSquareIcon className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                  {proofModal.message}
                </p>
              </div>
            )}

            {/* File preview */}
            <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center min-h-64">
              {/\.(jpg|jpeg|png|webp)(\?|$)/i.test(proofModal.url) ? (
                <img
                  src={proofModal.url}
                  alt="Bukti pembayaran"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow"
                />
              ) : (
                <iframe
                  src={proofModal.url}
                  className="w-full h-[60vh] border-0"
                  title="Bukti pembayaran"
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <a
                href={proofModal.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Buka di Tab Baru
              </a>
              <button
                onClick={() => setProofModal(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
