"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DollarSignIcon,
  XCircleIcon,
  TrendingUpIcon,
  ClockIcon,
  AlertCircleIcon,
  FileTextIcon,
  ArrowRightIcon,
  ImageIcon,
} from "lucide-react";

interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  childName: string;
  packageType: string;
  therapyType: string;
  sessions: number;
  amount: number;
  status: "unpaid" | "paid" | "overdue";
  dueDate: string;
  paidAt?: string;
  isVisibleToParent: boolean;
  notes: string;
  adminName: string;
  paymentProofKey?: string;
  paymentMessage?: string;
  createdAt: string;
  parentId?: { _id: string; name: string; email: string; phone?: string };
}

interface Transaction {
  _id: string;
  childName: string;
  adminName: string;
  type: "topup" | "deduct";
  packageType: string | null;
  therapyType: string | null;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
  packageId?: { name: string; sessions: number; price: number };
}

interface Summary {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  countPaid: number;
  countUnpaid: number;
  countOverdue: number;
  totalCount: number;
}

const STATUS_LABEL: Record<string, string> = { unpaid: "Belum Bayar", paid: "Lunas", overdue: "Jatuh Tempo" };
const STATUS_COLOR: Record<string, string> = {
  unpaid:  "bg-yellow-100 text-yellow-800",
  paid:    "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

/** Placeholder rows for a table body while its own tab's data is loading —
 * each tab (invoices/transactions) fetches independently, so only that
 * tab's table shows this, not the whole page. */
function FinancialTableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, c) => (
              <th key={c} className="px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-[110px]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Full-page skeleton for the initial load, matching the same header + stat
 * cards + content shape every other dashboard page uses. */
function FinancialSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-8 w-32 mb-2" />
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-16" />
      </div>

      <FinancialTableSkeleton columns={7} />
    </div>
  );
}

export default function SuperAdminFinancialPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const [activeTab, setActiveTab] = useState<"invoices" | "transactions">("invoices");

  // Invoices
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [invTotal, setInvTotal] = useState(0);
  const [invPage, setInvPage] = useState(1);
  const [invStatus, setInvStatus] = useState("");
  const [invFrom, setInvFrom] = useState("");
  const [invTo, setInvTo] = useState("");
  const [invLoading, setInvLoading] = useState(true);

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txType, setTxType] = useState("");
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");
  const [txLoading, setTxLoading] = useState(false);

  // Invoice detail dialog
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchInvoices = useCallback(async (page = 1) => {
    setInvLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (invStatus) params.set("status", invStatus);
      if (invFrom)   params.set("from", invFrom);
      if (invTo)     params.set("to", invTo);
      const res = await fetch(`/api/super-admin/financial?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setInvoices(result.invoices);
        setInvTotal(result.total);
        setSummary(result.summary);
        setInvPage(page);
      }
    } catch {}
    finally { setInvLoading(false); }
  }, [invStatus, invFrom, invTo, token]);

  const fetchTransactions = useCallback(async (page = 1) => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (txType) params.set("type", txType);
      if (txFrom) params.set("from", txFrom);
      if (txTo)   params.set("to", txTo);
      const res = await fetch(`/api/super-admin/financial/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setTransactions(result.transactions);
        setTxTotal(result.total);
        setTxPage(page);
      }
    } catch {}
    finally { setTxLoading(false); }
  }, [txType, txFrom, txTo, token]);

  useEffect(() => { fetchInvoices(1); }, [invStatus, invFrom, invTo]);
  useEffect(() => { if (activeTab === "transactions") fetchTransactions(1); }, [activeTab, txType, txFrom, txTo]);

  const openInvoiceDetail = async (inv: InvoiceData) => {
    setSelectedInvoice(inv);
    setProofUrl(null);
    if (inv.paymentProofKey) {
      setProofLoading(true);
      try {
        const res = await fetch(`/api/invoices/${inv._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setProofUrl(result.invoice?.paymentProofUrl || null);
      } catch {}
      finally { setProofLoading(false); }
    }
  };

  if (!permissions.hasPermission("financial:view_all")) {
    return (
      <div className="py-20 text-center text-gray-500">
        <XCircleIcon className="h-10 w-10 mx-auto mb-3 text-red-400" />
        <p className="font-medium text-gray-700">Akses Ditolak</p>
        <p className="text-sm">Halaman ini hanya untuk Super Admin.</p>
      </div>
    );
  }

  if (invLoading && !summary) {
    return <FinancialSkeleton />;
  }

  const invPages = Math.ceil(invTotal / 20);
  const txPages  = Math.ceil(txTotal / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSignIcon className="h-6 w-6 text-teal-600" />
          Laporan Keuangan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan lengkap seluruh transaksi, invoice, dan pendapatan klinik.
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUpIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Pendapatan</p>
                  <p className="text-lg font-bold text-gray-900">{formatRupiah(summary.totalRevenue)}</p>
                  <p className="text-xs text-gray-400">{summary.countPaid} invoice lunas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Menunggu Bayar</p>
                  <p className="text-lg font-bold text-gray-900">{formatRupiah(summary.totalPending)}</p>
                  <p className="text-xs text-gray-400">{summary.countUnpaid} invoice</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircleIcon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Jatuh Tempo</p>
                  <p className="text-lg font-bold text-gray-900">{formatRupiah(summary.totalOverdue)}</p>
                  <p className="text-xs text-gray-400">{summary.countOverdue} invoice</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FileTextIcon className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Invoice</p>
                  <p className="text-lg font-bold text-gray-900">{summary.totalCount}</p>
                  <p className="text-xs text-gray-400">Semua periode</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["invoices", "transactions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "invoices" ? "Invoice" : "Transaksi Token"}
          </button>
        ))}
      </div>

      {/* === INVOICES TAB === */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={invStatus}
                onChange={(e) => setInvStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Semua</option>
                <option value="paid">Lunas</option>
                <option value="unpaid">Belum Bayar</option>
                <option value="overdue">Jatuh Tempo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dari</label>
              <Input type="date" value={invFrom} onChange={(e) => setInvFrom(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sampai</label>
              <Input type="date" value={invTo} onChange={(e) => setInvTo(e.target.value)} className="text-sm" />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setInvStatus(""); setInvFrom(""); setInvTo(""); }}>
              Reset
            </Button>
          </div>

          {invLoading ? (
            <FinancialTableSkeleton columns={7} />
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Tidak ada invoice.</div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">No. Invoice</th>
                      <th className="px-4 py-3 text-left">Anak / Parent</th>
                      <th className="px-4 py-3 text-left">Paket</th>
                      <th className="px-4 py-3 text-right">Jumlah</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-left">Jatuh Tempo</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{inv.childName}</p>
                          {inv.parentId && (
                            <p className="text-xs text-gray-400">{(inv.parentId as any).name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-900">{inv.packageType}</p>
                          <p className="text-xs text-gray-400">{inv.therapyType} • {inv.sessions} sesi</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatRupiah(inv.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={STATUS_COLOR[inv.status]}>
                            {STATUS_LABEL[inv.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(inv.dueDate)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openInvoiceDetail(inv)}
                            className="text-teal-600 hover:text-teal-800 p-1"
                          >
                            <ArrowRightIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {invPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-500">Total {invTotal} invoice</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={invPage <= 1} onClick={() => fetchInvoices(invPage - 1)}>
                      Sebelumnya
                    </Button>
                    <span className="px-3 py-1 text-gray-600">{invPage} / {invPages}</span>
                    <Button size="sm" variant="outline" disabled={invPage >= invPages} onClick={() => fetchInvoices(invPage + 1)}>
                      Berikutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === TRANSACTIONS TAB === */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipe</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Semua</option>
                <option value="topup">Topup</option>
                <option value="deduct">Deduct</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dari</label>
              <Input type="date" value={txFrom} onChange={(e) => setTxFrom(e.target.value)} className="text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sampai</label>
              <Input type="date" value={txTo} onChange={(e) => setTxTo(e.target.value)} className="text-sm" />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setTxType(""); setTxFrom(""); setTxTo(""); }}>
              Reset
            </Button>
          </div>

          {txLoading ? (
            <FinancialTableSkeleton columns={7} />
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Tidak ada transaksi.</div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Tanggal</th>
                      <th className="px-4 py-3 text-left">Anak</th>
                      <th className="px-4 py-3 text-left">Admin</th>
                      <th className="px-4 py-3 text-left">Paket</th>
                      <th className="px-4 py-3 text-center">Tipe</th>
                      <th className="px-4 py-3 text-right">Sesi</th>
                      <th className="px-4 py-3 text-left">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{tx.childName}</td>
                        <td className="px-4 py-3 text-gray-600">{tx.adminName}</td>
                        <td className="px-4 py-3">
                          {tx.packageType ? (
                            <div>
                              <p className="text-gray-900">{tx.packageType}</p>
                              {tx.therapyType && <p className="text-xs text-gray-400">{tx.therapyType}</p>}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Manual</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={tx.type === 'topup' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {tx.type === 'topup' ? '+' : '-'}{tx.amount}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{tx.amount}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{tx.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {txPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-500">Total {txTotal} transaksi</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={txPage <= 1} onClick={() => fetchTransactions(txPage - 1)}>
                      Sebelumnya
                    </Button>
                    <span className="px-3 py-1 text-gray-600">{txPage} / {txPages}</span>
                    <Button size="sm" variant="outline" disabled={txPage >= txPages} onClick={() => fetchTransactions(txPage + 1)}>
                      Berikutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Invoice</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">No. Invoice</p>
                  <p className="font-mono font-medium">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Status</p>
                  <Badge className={STATUS_COLOR[selectedInvoice.status]}>
                    {STATUS_LABEL[selectedInvoice.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Anak</p>
                  <p className="font-medium">{selectedInvoice.childName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Parent</p>
                  <p className="font-medium">{(selectedInvoice.parentId as any)?.name || "-"}</p>
                  <p className="text-xs text-gray-400">{(selectedInvoice.parentId as any)?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Paket</p>
                  <p className="font-medium">{selectedInvoice.packageType}</p>
                  <p className="text-xs text-gray-400">{selectedInvoice.therapyType} • {selectedInvoice.sessions} sesi</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Jumlah</p>
                  <p className="font-bold text-teal-700 text-base">{formatRupiah(selectedInvoice.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Jatuh Tempo</p>
                  <p>{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                {selectedInvoice.paidAt && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Dibayar</p>
                    <p>{formatDate(selectedInvoice.paidAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Dibuat oleh Admin</p>
                  <p>{selectedInvoice.adminName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Terlihat Parent</p>
                  <p>{selectedInvoice.isVisibleToParent ? "Ya" : "Tidak"}</p>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Catatan</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded p-2">{selectedInvoice.notes}</p>
                </div>
              )}

              {selectedInvoice.paymentMessage && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Pesan Pembayaran dari Parent</p>
                  <p className="text-sm text-gray-700 bg-blue-50 rounded p-2">{selectedInvoice.paymentMessage}</p>
                </div>
              )}

              {/* Payment Proof */}
              {selectedInvoice.paymentProofKey && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Bukti Pembayaran</p>
                  {proofLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="animate-spin h-4 w-4 border-b-2 border-teal-500 rounded-full" />
                      Memuat bukti...
                    </div>
                  ) : proofUrl ? (
                    <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={proofUrl}
                        alt="Bukti bayar"
                        className="max-h-48 rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-90"
                      />
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <ImageIcon className="h-4 w-4" />
                      Bukti tidak tersedia
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
