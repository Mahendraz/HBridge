"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ReceiptIcon, CalendarIcon, CheckCircleIcon,
  XCircleIcon, ClockIcon, EyeIcon, EyeOffIcon, FilterIcon,
  UploadCloudIcon, MessageSquareIcon, X, FileImageIcon, DownloadIcon,
  PencilIcon, Trash2Icon, LandmarkIcon,
} from "lucide-react";

interface BankAccount {
  _id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  notes?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  childName: string;
  packageType: 'gold' | 'platinum' | 'diamond';
  therapyType: 'OT' | 'TW' | 'both' | 'assessment';
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
const THERAPY_LABEL: Record<string, string> = { OT: 'OT', TW: 'TW', both: 'OT & TW', assessment: 'Asesmen' };
const THERAPY_COLOR: Record<string, string> = {
  OT:         'bg-blue-50 text-blue-700',
  TW:         'bg-purple-50 text-purple-700',
  both:       'bg-teal-50 text-teal-700',
  assessment: 'bg-amber-50 text-amber-700',
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
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
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

  const [editModal, setEditModal] = useState<Invoice | null>(null);
  const [editAmount, setEditAmount] = useState<number | string>('');
  const [editSessions, setEditSessions] = useState<number | string>('');
  const [editPackageType, setEditPackageType] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        setBankAccounts(data.bankAccounts ?? []);
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

  const handleDownloadInvoicePdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        alert('Gagal membuat PDF invoice.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('Gagal membuat PDF invoice.');
    }
  };

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

  const openEditModal = (inv: Invoice) => {
    setEditModal(inv);
    setEditAmount(inv.amount);
    setEditSessions(inv.sessions);
    setEditPackageType(inv.packageType);
    setEditNotes(inv.notes || '');
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const body: Record<string, unknown> = { notes: editNotes };
      if (editModal.status !== 'paid') {
        body.amount = Number(editAmount) || 0;
        body.sessions = Number(editSessions) || 1;
        body.packageType = editPackageType;
      }
      const result = await patch(editModal._id, body);
      const updated = result?.invoice;
      if (updated) {
        setInvoices(prev => prev.map(i => i._id === editModal._id ? { ...i, ...updated, _id: i._id } : i));
      }
      setEditModal(null);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Gagal menyimpan perubahan');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!confirm(`Hapus invoice ${inv.invoiceNumber}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingId(inv._id);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${inv._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setInvoices(prev => prev.filter(i => i._id !== inv._id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus invoice');
    } finally {
      setDeletingId(null);
    }
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
    return <InvoicesSkeleton isAdmin={isAdmin} />;
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
                    {THERAPY_LABEL[inv.therapyType] ?? inv.therapyType}
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

                <button
                  onClick={() => handleDownloadInvoicePdf(inv._id, inv.invoiceNumber)}
                  className="w-full mt-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  Unduh Invoice
                </button>

                {inv.status === 'paid' && inv.paidAt && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircleIcon className="h-3 w-3" />
                    Dibayar pada {formatDate(inv.paidAt)}
                  </p>
                )}

                {inv.notes && (
                  <p className="text-xs text-gray-400 mt-2 italic">{inv.notes}</p>
                )}

                {/* Bank transfer details */}
                {inv.status !== 'paid' && bankAccounts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <LandmarkIcon className="h-3.5 w-3.5 text-teal-600" /> Rekening Tujuan Transfer
                    </p>
                    {bankAccounts.map((acc) => (
                      <div key={acc._id} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                        <p className="text-xs font-semibold text-gray-900">{acc.bankName}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{acc.accountNumber} a.n. {acc.accountHolderName}</p>
                        {acc.notes && <p className="text-xs text-gray-400 italic mt-0.5">{acc.notes}</p>}
                      </div>
                    ))}
                  </div>
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
            <table className="w-full min-w-[1300px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">No. Invoice</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Pasien</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Paket</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Harga</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Jatuh Tempo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Bukti Bayar</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Kirim ke Orang Tua</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Unduh</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((inv) => (
                  <tr key={inv._id} className={`hover:bg-gray-50 transition-colors ${inv.isVisibleToParent ? '' : 'opacity-75'}`}>
                    {/* No. Invoice */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-mono text-xs text-gray-600">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.createdAt)}</p>
                    </td>

                    {/* Pasien */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{inv.childName}</p>
                    </td>

                    {/* Paket */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${PACKAGE_COLOR[inv.packageType]}`}>
                          {PACKAGE_LABEL[inv.packageType]}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${THERAPY_COLOR[inv.therapyType]}`}>
                          {THERAPY_LABEL[inv.therapyType] ?? inv.therapyType}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{inv.sessions} sesi</span>
                      </div>
                    </td>

                    {/* Harga */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <p className="font-semibold text-gray-900">{formatRupiah(inv.amount)}</p>
                    </td>

                    {/* Jatuh Tempo */}
                    <td className="px-4 py-3 whitespace-nowrap">
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1.5">
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
                    <td className="px-4 py-3 whitespace-nowrap">
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
                    <td className="px-4 py-3 whitespace-nowrap">
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

                    {/* Unduh */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadInvoicePdf(inv._id, inv.invoiceNumber)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <DownloadIcon className="h-3 w-3" /> Unduh
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(inv)}
                          className="p-1.5 rounded text-gray-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          title="Edit invoice"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          disabled={deletingId === inv._id}
                          className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Hapus invoice"
                        >
                          {deletingId === inv._id ? (
                            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2Icon className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit invoice modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !editSaving && setEditModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-mono">{editModal.invoiceNumber}</p>
                <p className="font-semibold text-gray-900 text-sm mt-0.5">Edit Invoice</p>
              </div>
              <button
                onClick={() => setEditModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {editModal.status === 'paid' && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  Invoice ini sudah lunas — nominal tidak bisa diubah. Batalkan status lunas dulu di halaman utama kalau perlu revisi nominal.
                </div>
              )}
              {editError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Paket</label>
                <input
                  type="text"
                  value={editPackageType}
                  onChange={(e) => setEditPackageType(e.target.value)}
                  disabled={editModal.status === 'paid'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah Sesi</label>
                  <input
                    type="number"
                    min={1}
                    value={editSessions}
                    onChange={(e) => setEditSessions(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                    disabled={editModal.status === 'paid'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah Tagihan (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                    disabled={editModal.status === 'paid'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setEditModal(null)}
                disabled={editSaving}
                className="px-3 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="px-4 py-2 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-40"
              >
                {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
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

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function InvoicesSkeleton({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 text-center space-y-2">
            <Skeleton className="h-7 w-10 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        ))}
      </div>

      <Skeleton className="h-6 w-72" />

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {Array.from({ length: 10 }).map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((_, c) => (
                    <td key={c} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-[100px]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
