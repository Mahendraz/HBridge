"use client";

import { useState, useEffect } from "react";
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
  LandmarkIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";

interface BankAccount {
  _id?: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  notes?: string;
  isActive: boolean;
  order: number;
}

const EMPTY_FORM: BankAccount = { bankName: "", accountNumber: "", accountHolderName: "", notes: "", isActive: true, order: 0 };

export default function SuperAdminBankAccountsPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<BankAccount>({ ...EMPTY_FORM });
  const [saveError, setSaveError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/bank-accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setAccounts((result.accounts ?? []).sort((a: BankAccount, b: BankAccount) => a.order - b.order));
      } else {
        setError(result.error || "Gagal memuat rekening");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const persist = async (next: BankAccount[]) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/bank-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accounts: next.map((acc, i) => ({ ...acc, order: i })) }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setAccounts(result.accounts);
        return true;
      }
      setError(result.error || "Gagal menyimpan");
      return false;
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingIndex(null);
    setForm({ ...EMPTY_FORM, order: accounts.length });
    setSaveError(null);
    setShowDialog(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setForm({ ...accounts[index] });
    setSaveError(null);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.bankName.trim())          { setSaveError("Nama bank wajib diisi"); return; }
    if (!form.accountNumber.trim())     { setSaveError("Nomor rekening wajib diisi"); return; }
    if (!form.accountHolderName.trim()) { setSaveError("Nama pemilik rekening wajib diisi"); return; }

    setSaveError(null);
    const next = [...accounts];
    if (editingIndex === null) {
      next.push({ ...form });
    } else {
      next[editingIndex] = { ...form };
    }
    const ok = await persist(next);
    if (ok) setShowDialog(false);
  };

  const handleToggleActive = async (index: number) => {
    const next = [...accounts];
    next[index] = { ...next[index], isActive: !next[index].isActive };
    await persist(next);
  };

  const handleDelete = async (index: number) => {
    if (!confirm(`Hapus rekening "${accounts[index].bankName}"?`)) return;
    const next = accounts.filter((_, i) => i !== index);
    await persist(next);
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= accounts.length) return;
    const next = [...accounts];
    [next[index], next[target]] = [next[target], next[index]];
    await persist(next);
  };

  if (!permissions.hasPermission("bank_accounts:manage")) {
    return (
      <div className="py-20 text-center text-gray-500">
        <XCircleIcon className="h-10 w-10 mx-auto mb-3 text-red-400" />
        <p className="font-medium text-gray-700">Akses Ditolak</p>
        <p className="text-sm">Halaman ini hanya untuk Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LandmarkIcon className="h-6 w-6 text-teal-600" />
            Rekening Bank
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola rekening tujuan transfer yang ditampilkan pada invoice untuk orang tua.
          </p>
        </div>
        <Button onClick={openCreate} disabled={saving}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Rekening
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-14 rounded-full shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <LandmarkIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">Belum ada rekening</p>
            <p className="text-sm text-gray-400 mt-1">Klik "Tambah Rekening" agar orang tua tahu ke mana harus transfer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc, index) => (
            <Card key={acc._id ?? index} className={`relative ${!acc.isActive ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{acc.bankName}</CardTitle>
                  <Badge variant={acc.isActive ? "default" : "secondary"} className="shrink-0">
                    {acc.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Nomor Rekening</p>
                  <p className="font-semibold text-gray-900">{acc.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Atas Nama</p>
                  <p className="font-medium text-gray-700">{acc.accountHolderName}</p>
                </div>
                {acc.notes && (
                  <p className="text-xs text-gray-500 line-clamp-2">{acc.notes}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => handleMove(index, -1)} disabled={index === 0 || saving}>
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleMove(index, 1)} disabled={index === accounts.length - 1 || saving}>
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(index)}>
                    <PencilIcon className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={acc.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                    onClick={() => handleToggleActive(index)}
                  >
                    {acc.isActive ? <XCircleIcon className="h-3.5 w-3.5" /> : <CheckCircleIcon className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(index)}>
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIndex === null ? "Tambah Rekening Baru" : "Edit Rekening"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {saveError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {saveError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nama Bank *</label>
              <Input
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="Contoh: BCA"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nomor Rekening *</label>
              <Input
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="Contoh: 1234567890"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Atas Nama *</label>
              <Input
                value={form.accountHolderName}
                onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                placeholder="Contoh: PT Hearty Bridge Indonesia"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Catatan (opsional)</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Contoh: khusus untuk sesi OT"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)} disabled={saving}>
                Batal
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : editingIndex === null ? "Tambah" : "Simpan Perubahan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
