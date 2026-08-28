"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PackageIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";

interface PackageData {
  _id: string;
  name: string;
  sessions: number;
  price: number;
  therapyType: "OT" | "TW" | "both" | "assessment";
  description?: string;
  isActive: boolean;
  createdAt: string;
}

const THERAPY_LABEL: Record<string, string> = { OT: "Terapi Okupasi", TW: "Terapi Wicara", both: "OT & TW", assessment: "Asesmen" };
const THERAPY_COLOR: Record<string, string> = {
  OT:         "bg-blue-50 text-blue-700 border-blue-200",
  TW:         "bg-purple-50 text-purple-700 border-purple-200",
  both:       "bg-teal-50 text-teal-700 border-teal-200",
  assessment: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

const EMPTY_FORM = { name: "", sessions: 1, price: 0, therapyType: "both" as "OT" | "TW" | "both" | "assessment", description: "" };

export default function SuperAdminPackagesPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/packages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setPackages(result.packages);
      } else {
        setError(result.error || "Gagal memuat paket");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setSaveError(null);
    setShowDialog(true);
  };

  const openEdit = (pkg: PackageData) => {
    setEditingId(pkg._id);
    setForm({
      name: pkg.name,
      sessions: pkg.therapyType === 'assessment' ? 1 : pkg.sessions,
      price: pkg.price,
      therapyType: pkg.therapyType as "OT" | "TW" | "both" | "assessment",
      description: pkg.description || "",
    });
    setSaveError(null);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveError("Nama paket wajib diisi"); return; }
    if (form.sessions < 1) { setSaveError("Jumlah sesi minimal 1"); return; }
    if (form.price < 0)    { setSaveError("Harga tidak boleh negatif"); return; }

    setSaving(true);
    setSaveError(null);
    try {
      const url    = editingId ? `/api/super-admin/packages/${editingId}` : "/api/super-admin/packages";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setShowDialog(false);
        fetchPackages();
      } else {
        setSaveError(result.error || result.details?.[0]?.message || "Gagal menyimpan");
      }
    } catch {
      setSaveError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg: PackageData) => {
    try {
      const res = await fetch(`/api/super-admin/packages/${pkg._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      });
      if (res.ok) fetchPackages();
    } catch {}
  };

  const handleDelete = async (pkg: PackageData) => {
    if (!confirm(`Nonaktifkan paket "${pkg.name}"?`)) return;
    try {
      const res = await fetch(`/api/super-admin/packages/${pkg._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchPackages();
    } catch {}
  };

  // OT-only/TW-only are legacy — only offered when editing a package that's already
  // one of those types (so the current value stays selectable), never for a new package.
  const therapyTypeOptions =
    editingId && (form.therapyType === "OT" || form.therapyType === "TW")
      ? (["OT", "TW", "both", "assessment"] as const)
      : (["both", "assessment"] as const);

  if (!permissions.hasPermission("packages:view")) {
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
            <PackageIcon className="h-6 w-6 text-teal-600" />
            Kelola Paket Terapi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Buat dan kelola paket yang bisa dipilih oleh admin untuk diberikan ke pasien.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Paket
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
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Memuat paket...</p>
        </div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <PackageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">Belum ada paket</p>
            <p className="text-sm text-gray-400 mt-1">Klik "Tambah Paket" untuk membuat paket baru.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg._id} className={`relative ${!pkg.isActive ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{pkg.name}</CardTitle>
                    <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full border ${THERAPY_COLOR[pkg.therapyType]}`}>
                      {THERAPY_LABEL[pkg.therapyType]}
                    </span>
                  </div>
                  <Badge variant={pkg.isActive ? "default" : "secondary"} className="shrink-0">
                    {pkg.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Sesi</p>
                    <p className="font-semibold text-gray-900">{pkg.sessions} sesi</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Harga</p>
                    <p className="font-semibold text-teal-700">{formatRupiah(pkg.price)}</p>
                  </div>
                </div>
                {pkg.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{pkg.description}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(pkg)}>
                    <PencilIcon className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={pkg.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                    onClick={() => handleToggleActive(pkg)}
                  >
                    {pkg.isActive ? <XCircleIcon className="h-3.5 w-3.5" /> : <CheckCircleIcon className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(pkg)}>
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
            <DialogTitle>{editingId ? "Edit Paket" : "Tambah Paket Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {saveError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {saveError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nama Paket *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Contoh: Gold OT"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Jumlah Sesi *
                  {form.therapyType === "assessment" && (
                    <span className="ml-1 text-amber-600 font-normal">(1 sesi, terkunci)</span>
                  )}
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.therapyType === "assessment" ? 1 : form.sessions}
                  readOnly={form.therapyType === "assessment"}
                  onChange={(e) => {
                    if (form.therapyType !== "assessment") {
                      setForm({ ...form, sessions: parseInt(e.target.value) || 1 });
                    }
                  }}
                  className={form.therapyType === "assessment" ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Harga (Rp) *</label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Terapi *</label>
              {/* Paket OT-only/TW-only terpisah sudah digabung — hanya bisa dipilih lagi saat
                  mengedit paket lama yang masih bertipe itu, tidak untuk paket baru. */}
              <div className={`grid gap-2 ${therapyTypeOptions.length === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
                {therapyTypeOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, therapyType: t, sessions: t === "assessment" ? 1 : form.sessions })}
                    className={`py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                      form.therapyType === t
                        ? t === "assessment"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-200 text-gray-600 hover:border-teal-300"
                    }`}
                  >
                    {t === "both" ? "OT & TW" : t === "assessment" ? "Asesmen" : t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Deskripsi singkat paket ini..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)} disabled={saving}>
                Batal
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Paket"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
