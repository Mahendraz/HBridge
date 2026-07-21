"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftIcon,
  BabyIcon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  MailIcon,
  HeartIcon,
  StethoscopeIcon,
  AlertCircleIcon,
  ClipboardListIcon,
  PencilIcon,
  PackageIcon,
  PlusIcon,
  CameraIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ChildDetail {
  id: string;
  name: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  isActive: boolean;
  createdAt: string;
  photoUrl?: string | null;
  parent?: { id: string; name: string; email: string; phone?: string };
  therapist?: { id: string; name: string; email: string; specialization?: string; clinic?: string };
  medicalInfo?: { conditions: string[]; medications: string[]; allergies: string[]; notes: string };
  tokenBalance?: number;
}

interface TokenTransaction {
  _id: string;
  type: 'topup' | 'deduct';
  packageType: string | null;
  therapyType?: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  note: string;
  adminName: string;
  createdAt: string;
}

interface InvoiceRecord {
  _id: string;
  invoiceNumber: string;
  packageTransactionId: string;
  status: 'unpaid' | 'paid' | 'overdue';
  dueDate: string;
  amount: number;
}

interface AvailablePackage {
  _id: string;
  name: string;
  sessions: number;
  price: number;
  therapyType: 'OT' | 'TW' | 'both';
  description?: string;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PatientDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params?.id as string;

  const [child, setChild] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Photo upload + crop
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [cropFileName, setCropFileName] = useState<string>("photo.jpg");

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string; dateOfBirth: string; gender: "male" | "female";
    conditions: string; medications: string; allergies: string; notes: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Package state
  const [packages, setPackages] = useState<TokenTransaction[]>([]);
  const [invoiceMap, setInvoiceMap] = useState<Record<string, InvoiceRecord>>({});
  const [tokenSaving, setTokenSaving] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState<string | null>(null);
  const [selectedTherapyType, setSelectedTherapyType] = useState<'OT' | 'TW' | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<AvailablePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [pendingPackage, setPendingPackage] = useState<AvailablePackage | null>(null);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState('');

  // Derived discount values — computed from pendingPackage + discount inputs
  const discountAmt = pendingPackage
    ? discountType === 'percent'
      ? Math.round(pendingPackage.price * (Math.min(100, Math.max(0, parseFloat(discountValue || '0'))) / 100))
      : Math.round(Math.min(pendingPackage.price, Math.max(0, parseFloat(discountValue || '0'))))
    : 0;
  const discountFinalPrice = pendingPackage ? pendingPackage.price - discountAmt : 0;
  const discountInvalid = discountValue !== '' && (
    isNaN(parseFloat(discountValue)) ||
    parseFloat(discountValue) < 0 ||
    (discountType === 'percent' && parseFloat(discountValue) > 100)
  );

  // Assessment state
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({
    OT: { conducted: false, needsTherapy: null as boolean | null, notes: '' },
    TW: { conducted: false, needsTherapy: null as boolean | null, notes: '' },
  });
  const [resultSaving, setResultSaving] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchChild();
      fetchPackages();
      fetchAssessments();
    }
  }, [id]);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchAvailablePackages();
    }
  }, [user?.role]);

  const fetchChild = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/children/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setChild(result.child);
        setPhotoUrl(result.child.photoUrl ?? null);
      } else {
        setError(result.error || result.message || "Gagal memuat data anak.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/children/${id}/assessments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setAssessments(result.data?.assessments ?? []);
      }
    } catch {
      // silently fail
    }
  };

  const handleSaveResult = async () => {
    if (!selectedAssessment) return;
    if (!resultForm.OT.conducted && !resultForm.TW.conducted) {
      setResultError('Minimal satu jenis asesmen (OT atau TW) harus dilakukan.');
      return;
    }
    setResultSaving(true);
    setResultError(null);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        result: {
          OT: resultForm.OT.conducted ? { conducted: true, needsTherapy: resultForm.OT.needsTherapy, notes: resultForm.OT.notes } : null,
          TW: resultForm.TW.conducted ? { conducted: true, needsTherapy: resultForm.TW.needsTherapy, notes: resultForm.TW.notes } : null,
        },
      };
      const res = await fetch(`/api/assessments/${selectedAssessment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal menyimpan hasil');
      }
      setShowResultModal(false);
      setSelectedAssessment(null);
      await fetchAssessments();
    } catch (e) {
      setResultError(e instanceof Error ? e.message : 'Gagal menyimpan hasil');
    } finally {
      setResultSaving(false);
    }
  };

  // File selected → open crop modal
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setCropFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  // Set initial centered square crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const initial = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, 1, width, height),
      width,
      height
    );
    setCrop(initial);
    setCompletedCrop(initial);
  }, []);

  // Render crop to canvas → upload
  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const img = imgRef.current;
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const size = 400;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // Circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      const cropX = (completedCrop.x / 100) * img.naturalWidth;
      const cropY = (completedCrop.y / 100) * img.naturalHeight;
      const cropW = (completedCrop.width / 100) * img.naturalWidth;
      const cropH = (completedCrop.height / 100) * img.naturalHeight;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, size, size);

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/jpeg", 0.92)
      );
      if (!blob) throw new Error("Canvas empty");

      const form = new FormData();
      form.append("file", blob, "photo.jpg");

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/children/${id}/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setPhotoUrl(result.photoUrl ?? null);
        setCropSrc(null);
      } else {
        setPhotoError(result.error || "Gagal mengupload foto");
      }
    } catch {
      setPhotoError("Terjadi kesalahan saat mengupload foto");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/children/${id}/photo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPhotoUrl(null);
      } else {
        const result = await res.json();
        setPhotoError(result.error || "Gagal menghapus foto");
      }
    } catch {
      setPhotoError("Terjadi kesalahan saat menghapus foto");
    } finally {
      setPhotoUploading(false);
    }
  };

  const fetchAvailablePackages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/super-admin/packages?active=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setAvailablePackages(result.packages ?? []);
      }
    } catch {}
  };

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem("token");
      const [txRes, invRes] = await Promise.all([
        fetch(`/api/children/${id}/tokens`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/invoices?childId=${id}&limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (txRes.ok) {
        const txResult = await txRes.json();
        const allTx: TokenTransaction[] = txResult.data?.transactions ?? [];
        setPackages(allTx.filter((tx) => tx.type === 'topup' && tx.packageType));
      }

      if (invRes.ok) {
        const invResult = await invRes.json();
        const invs: InvoiceRecord[] = invResult.invoices ?? [];
        const map: Record<string, InvoiceRecord> = {};
        for (const inv of invs) {
          if (inv.packageTransactionId) map[inv.packageTransactionId] = inv;
        }
        setInvoiceMap(map);
      }
    } catch {
      // silently fail
    }
  };

  const handleAssignPackage = async (pkgId: string, discountAmount: number) => {
    setTokenError(null);
    setTokenSuccess(null);
    setTokenSaving(pkgId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/children/${id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: pkgId, discountAmount }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const pkgName = result.data?.packageName || 'Paket';
        setTokenSuccess(`${pkgName} (${result.data?.totalSessions} sesi) berhasil di-assign!`);
        setShowAssignForm(false);
        setSelectedTherapyType(null);
        setSelectedPackageId(null);
        setPendingPackage(null);
        setDiscountValue('');
        setDiscountType('percent');
        await fetchPackages();
        await fetchChild();
      } else {
        setTokenError(result.error || result.message || 'Gagal assign paket');
      }
    } catch {
      setTokenError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setTokenSaving(null);
    }
  };

  const openEdit = () => {
    if (!child) return;
    setEditForm({
      name: child.name,
      dateOfBirth: child.dateOfBirth ? child.dateOfBirth.split("T")[0] : "",
      gender: (child.gender === "male" ? "male" : "female") as "male" | "female",
      conditions: child.medicalInfo?.conditions?.join(", ") || "",
      medications: child.medicalInfo?.medications?.join(", ") || "",
      allergies: child.medicalInfo?.allergies?.join(", ") || "",
      notes: child.medicalInfo?.notes || "",
    });
    setSaveError(null);
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    setSaveError(null);
    try {
      const token = localStorage.getItem("token");
      const body = {
        name: editForm.name,
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
        medicalInfo: {
          conditions: editForm.conditions.split(",").map((s) => s.trim()).filter(Boolean),
          medications: editForm.medications.split(",").map((s) => s.trim()).filter(Boolean),
          allergies: editForm.allergies.split(",").map((s) => s.trim()).filter(Boolean),
          notes: editForm.notes,
        },
      };
      const res = await fetch(`/api/children/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setShowEdit(false);
        fetchChild();
      } else {
        setSaveError(result.details?.[0]?.message || result.error || result.message || "Gagal menyimpan.");
      }
    } catch {
      setSaveError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-500">Memuat data pasien...</p>
        </div>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/patients">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <AlertCircleIcon className="h-12 w-12 mx-auto mb-3 text-red-400" />
            <p className="font-medium text-gray-900">Data tidak ditemukan</p>
            <p className="text-sm mt-1">{error || "Pasien ini tidak tersedia."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDOB = child.dateOfBirth
    ? new Date(child.dateOfBirth).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  const totalSessions = packages.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patients">
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>

          {/* Avatar */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal-200 bg-teal-50 flex items-center justify-center shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt={child.name} className="w-full h-full object-cover" onError={() => setPhotoUrl(null)} />
              ) : (
                <span className="text-2xl font-bold text-teal-600">
                  {child.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
              >
                {photoUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CameraIcon className="h-5 w-5 text-white" />
                )}
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{child.name}</h1>
              <Badge variant={child.isActive ? "default" : "secondary"}>
                {child.isActive ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {child.age} tahun &bull; {child.gender === "male" ? "Laki-laki" : "Perempuan"}
            </p>
            {(user?.role === "admin" || user?.role === "super_admin") && photoUrl && (
              <button
                onClick={handlePhotoDelete}
                disabled={photoUploading}
                className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <Trash2Icon className="h-3 w-3" />
                Hapus foto
              </button>
            )}
            {photoError && (
              <p className="mt-1 text-xs text-red-600">{photoError}</p>
            )}
          </div>
        </div>
        {(user?.role === "admin" || user?.role === "super_admin") && (
          <Button size="sm" onClick={openEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Data
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Medical + Packages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Dasar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BabyIcon className="h-5 w-5 text-teal-600" />
                Informasi Dasar
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tanggal Lahir</p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  {formattedDOB}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Usia</p>
                <p className="text-sm font-medium text-gray-900">{child.age} tahun</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Jenis Kelamin</p>
                <p className="text-sm font-medium text-gray-900">
                  {child.gender === "male" ? "Laki-laki" : "Perempuan"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <Badge variant={child.isActive ? "default" : "secondary"}>
                  {child.isActive ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
              {child.createdAt && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Terdaftar Sejak</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(child.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informasi Medis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HeartIcon className="h-5 w-5 text-red-500" />
                Informasi Medis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Diagnosa / Kondisi</p>
                {child.medicalInfo?.conditions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {child.medicalInfo.conditions.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-teal-700 border-teal-300">{c}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Belum ada diagnosa</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Obat-obatan</p>
                {child.medicalInfo?.medications?.length ? (
                  <ul className="list-disc list-inside space-y-1">
                    {child.medicalInfo.medications.map((m, i) => (
                      <li key={i} className="text-sm text-gray-900">{m}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic">Tidak ada</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Alergi</p>
                {child.medicalInfo?.allergies?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {child.medicalInfo.allergies.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-red-700 border-red-300">{a}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Tidak ada</p>
                )}
              </div>
              {child.medicalInfo?.notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Catatan Medis</p>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                    {child.medicalInfo.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paket Terapi */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PackageIcon className="h-5 w-5 text-teal-600" />
                  Paket Terapi
                  {packages.length > 0 && (
                    <span className="text-xs font-normal text-gray-500 ml-1">
                      ({packages.length} paket &bull; {totalSessions} sesi total)
                    </span>
                  )}
                </CardTitle>
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setShowAssignForm(!showAssignForm); setTokenError(null); setTokenSuccess(null); }}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Tambah Paket
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Success/Error messages */}
              {tokenSuccess && (
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  {tokenSuccess}
                </div>
              )}
              {tokenError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {tokenError}
                </div>
              )}

              {/* Assign form (admin/super_admin, collapsible) */}
              {(user?.role === 'admin' || user?.role === 'super_admin') && showAssignForm && (
                <div className="rounded-xl border-2 border-teal-100 bg-teal-50/40 p-4 space-y-4">
                  <p className="text-sm font-semibold text-teal-800">Assign Paket Baru</p>

                  {availablePackages.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
                      <PackageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      Belum ada paket tersedia. Super Admin perlu membuat paket terlebih dahulu.
                    </div>
                  ) : pendingPackage ? (
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                      {/* Header */}
                      <div className="bg-teal-600 px-4 py-3">
                        <p className="text-sm font-semibold text-white">Konfirmasi Assign Paket</p>
                      </div>

                      <div className="p-4 space-y-4">
                        {/* Paket info */}
                        <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{pendingPackage.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {pendingPackage.sessions} sesi &rarr; <span className="font-medium text-gray-700">{child?.name}</span>
                            </p>
                          </div>
                          <span className="text-sm font-bold text-gray-800 shrink-0">{formatRupiah(pendingPackage.price)}</span>
                        </div>

                        {/* Diskon */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Diskon <span className="normal-case font-normal text-gray-400">(opsional)</span>
                          </p>
                          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                            {/* Tipe toggle */}
                            <div className="flex shrink-0 border-r border-gray-200">
                              <button
                                type="button"
                                onClick={() => { setDiscountType('percent'); setDiscountValue(''); }}
                                className={`px-3 py-2 text-xs font-semibold transition-colors ${
                                  discountType === 'percent'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                %
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDiscountType('amount'); setDiscountValue(''); }}
                                className={`px-3 py-2 text-xs font-semibold transition-colors border-l border-gray-200 ${
                                  discountType === 'amount'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                Rp
                              </button>
                            </div>
                            {/* Input */}
                            <input
                              type="number"
                              min="0"
                              max={discountType === 'percent' ? 100 : pendingPackage.price}
                              step={discountType === 'percent' ? 1 : 1000}
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                              placeholder={discountType === 'percent' ? 'Masukkan persen (0–100)' : 'Masukkan nominal'}
                              className={`flex-1 text-sm px-3 py-2 outline-none bg-white placeholder:text-gray-300 ${
                                discountInvalid ? 'text-red-600' : 'text-gray-800'
                              }`}
                            />
                          </div>
                          {discountInvalid && (
                            <p className="text-xs text-red-500">
                              {discountType === 'percent' ? 'Persen harus antara 0–100' : 'Nominal tidak valid'}
                            </p>
                          )}
                        </div>

                        {/* Ringkasan harga */}
                        <div className="rounded-lg bg-gray-50 border border-gray-100 divide-y divide-gray-100">
                          <div className="flex justify-between items-center px-3 py-2 text-sm">
                            <span className="text-gray-500">Harga paket</span>
                            <span className="text-gray-700">{formatRupiah(pendingPackage.price)}</span>
                          </div>
                          {discountAmt > 0 && (
                            <div className="flex justify-between items-center px-3 py-2 text-sm">
                              <span className="text-green-600">
                                Diskon{discountType === 'percent' ? ` ${discountValue}%` : ''}
                              </span>
                              <span className="text-green-600 font-medium">− {formatRupiah(discountAmt)}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center px-3 py-2.5">
                            <span className="text-sm font-semibold text-gray-800">Total Tagihan</span>
                            <span className="text-base font-bold text-teal-700">{formatRupiah(discountFinalPrice)}</span>
                          </div>
                        </div>

                        {/* Footer */}
                        <p className="text-xs text-gray-400 text-center">Invoice otomatis dibuat setelah konfirmasi</p>

                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => { setPendingPackage(null); setDiscountValue(''); setDiscountType('percent'); }}
                            disabled={tokenSaving !== null}
                          >
                            Batal
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => handleAssignPackage(pendingPackage._id, discountAmt)}
                            disabled={tokenSaving !== null || discountInvalid}
                          >
                            {tokenSaving ? (
                              <span className="flex items-center justify-center gap-1.5">
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Menyimpan...
                              </span>
                            ) : 'Assign Paket'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500 mb-3">Pilih paket terapi:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availablePackages.map((pkg) => {
                          const therapyColors: Record<string, string> = {
                            OT:   'bg-blue-50 text-blue-700',
                            TW:   'bg-purple-50 text-purple-700',
                            both: 'bg-teal-50 text-teal-700',
                          };
                          return (
                            <button
                              key={pkg._id}
                              onClick={() => setPendingPackage(pkg)}
                              disabled={tokenSaving !== null}
                              className="flex items-center gap-3 p-3 rounded-xl border-2 bg-white transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed border-gray-200 hover:border-teal-400 hover:bg-teal-50"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">{pkg.name}</p>
                                <p className="text-xs text-gray-500">{pkg.sessions} sesi</p>
                                <p className="text-xs text-teal-700 font-medium">{formatRupiah(pkg.price)}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${therapyColors[pkg.therapyType] || 'bg-gray-100 text-gray-700'}`}>
                                {pkg.therapyType === 'both' ? 'OT & TW' : pkg.therapyType}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Package list */}
              {packages.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                  <PackageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">Belum ada paket terapi</p>
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <p className="text-xs text-gray-400 mt-1">Klik "Tambah Paket" untuk assign paket baru</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {packages.map((pkg) => {
                    const inv = invoiceMap[pkg._id];
                    // null therapyType = 'both' (OT & TW)
                    const therapyColor = pkg.therapyType === 'OT'
                      ? 'bg-blue-50 text-blue-700'
                      : pkg.therapyType === 'TW'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-teal-50 text-teal-700';
                    const therapyLabel = pkg.therapyType === 'OT' ? 'OT'
                      : pkg.therapyType === 'TW' ? 'TW'
                      : 'OT & TW';
                    const invStatusColor: Record<string, string> = {
                      unpaid: 'bg-yellow-100 text-yellow-800',
                      paid: 'bg-green-100 text-green-700',
                      overdue: 'bg-red-100 text-red-700',
                    };
                    const invStatusLabel: Record<string, string> = { unpaid: 'Belum Bayar', paid: 'Lunas', overdue: 'Jatuh Tempo' };
                    return (
                      <div
                        key={pkg._id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-teal-200 hover:bg-teal-50/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <PackageIcon className="h-8 w-8 text-teal-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                                {pkg.packageType || 'Paket'}
                              </span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${therapyColor}`}>
                                {therapyLabel}
                              </span>
                              <span className="text-xs text-gray-500">{pkg.amount} sesi</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Ditambahkan {formatDate(pkg.createdAt)}
                              {pkg.adminName && <span className="ml-1">· oleh {pkg.adminName}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {inv ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${invStatusColor[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {invStatusLabel[inv.status] ?? inv.status}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">{inv.invoiceNumber}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 italic">Belum ada invoice</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Riwayat Asesmen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardListIcon className="h-5 w-5 text-indigo-500" />
                Riwayat Asesmen
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Belum ada asesmen terjadwal.</p>
              ) : (
                <div className="space-y-3">
                  {assessments.map((a: any) => {
                    const assessorName = a.assessorId
                      ? typeof a.assessorId === 'object' ? a.assessorId.name : '—'
                      : 'Belum ditentukan';
                    const canFillResult =
                      user?.role === 'therapist' &&
                      a.assessorId &&
                      (typeof a.assessorId === 'object' ? a.assessorId._id : a.assessorId) === user?._id &&
                      a.status !== 'cancelled';
                    const hasResult = a.result?.OT || a.result?.TW;

                    return (
                      <div key={a._id} className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">
                                {new Date(a.date).toLocaleDateString('id-ID', {
                                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                })}
                              </span>
                              <span className="text-xs text-gray-500">· {a.time}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                a.status === 'completed' ? 'bg-green-100 text-green-700' :
                                a.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                                a.status === 'no-show' ? 'bg-red-100 text-red-700' :
                                'bg-sky-100 text-sky-700'
                              }`}>
                                {a.status === 'completed' ? 'Selesai' :
                                 a.status === 'cancelled' ? 'Dibatalkan' :
                                 a.status === 'no-show' ? 'Tidak Hadir' : 'Terjadwal'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Assessor: {assessorName} · {a.type === 'in-person' ? 'Tatap Langsung' : 'Video Call'}
                            </p>
                          </div>
                          {canFillResult && !hasResult && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 text-indigo-600 border-indigo-300 hover:bg-indigo-50 text-xs h-7"
                              onClick={() => {
                                setSelectedAssessment(a);
                                setResultForm({
                                  OT: { conducted: false, needsTherapy: null, notes: '' },
                                  TW: { conducted: false, needsTherapy: null, notes: '' },
                                });
                                setResultError(null);
                                setShowResultModal(true);
                              }}
                            >
                              Isi Hasil
                            </Button>
                          )}
                        </div>

                        {/* Result display */}
                        {hasResult && (
                          <div className="mt-2 pt-2 border-t border-indigo-100 grid grid-cols-2 gap-2">
                            {(['OT', 'TW'] as const).map((type) => {
                              const r = a.result?.[type];
                              if (!r) return (
                                <div key={type} className="rounded p-2 bg-white border border-gray-100">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Asesmen {type}</p>
                                  <p className="text-xs text-gray-400">Tidak dilakukan</p>
                                </div>
                              );
                              return (
                                <div key={type} className="rounded p-2 bg-white border border-gray-100">
                                  <p className="text-[10px] font-bold text-gray-600 uppercase mb-0.5">Asesmen {type}</p>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    r.needsTherapy === true ? 'bg-red-100 text-red-700' :
                                    r.needsTherapy === false ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-500'
                                  }`}>
                                    {r.needsTherapy === true ? 'Perlu Terapi' :
                                     r.needsTherapy === false ? 'Tidak Perlu' : 'Belum ditentukan'}
                                  </span>
                                  {r.notes && (
                                    <p className="text-[11px] text-gray-600 mt-1 italic">"{r.notes}"</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Orang Tua + Terapis */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserIcon className="h-5 w-5 text-blue-500" />
                Orang Tua
              </CardTitle>
            </CardHeader>
            <CardContent>
              {child.parent ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {child.parent.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900">{child.parent.name}</p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MailIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="break-all">{child.parent.email}</span>
                    </div>
                    {child.parent.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>{child.parent.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Data orang tua tidak tersedia</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <StethoscopeIcon className="h-5 w-5 text-teal-600" />
                Terapis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {child.therapist ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                      {child.therapist.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900">{child.therapist.name}</p>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MailIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="break-all">{child.therapist.email}</span>
                    </div>
                    {child.therapist.specialization && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ClipboardListIcon className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>{child.therapist.specialization}</span>
                      </div>
                    )}
                    {child.therapist.clinic && (
                      <p className="text-xs text-gray-500 ml-6">{child.therapist.clinic}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Belum ada terapis yang ditugaskan</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Isi Hasil Asesmen (assessor only) */}
      {showResultModal && selectedAssessment && (
        <Dialog open onOpenChange={(o) => { if (!o) { setShowResultModal(false); setSelectedAssessment(null); } }}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardListIcon className="h-4 w-4 text-indigo-600" />
                Isi Hasil Asesmen
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-sm text-indigo-700">
                {new Date(selectedAssessment.date).toLocaleDateString('id-ID', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })} · {selectedAssessment.time}
              </div>

              {resultError && (
                <p className="text-red-600 text-sm bg-red-50 rounded p-2">{resultError}</p>
              )}

              {(['OT', 'TW'] as const).map((type) => (
                <div key={type} className="rounded-lg border border-gray-200 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-800">
                      Asesmen {type === 'OT' ? 'Okupasi (OT)' : 'Wicara (TW)'}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resultForm[type].conducted}
                        onChange={(e) =>
                          setResultForm((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], conducted: e.target.checked },
                          }))
                        }
                        className="rounded text-indigo-600"
                      />
                      <span className="text-xs text-gray-600">Dilakukan</span>
                    </label>
                  </div>

                  {resultForm[type].conducted && (
                    <>
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Perlu terapi {type}?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setResultForm((prev) => ({
                                ...prev,
                                [type]: { ...prev[type], needsTherapy: true },
                              }))
                            }
                            className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                              resultForm[type].needsTherapy === true
                                ? 'bg-red-100 border-red-300 text-red-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Ya, Perlu Terapi
                          </button>
                          <button
                            onClick={() =>
                              setResultForm((prev) => ({
                                ...prev,
                                [type]: { ...prev[type], needsTherapy: false },
                              }))
                            }
                            className={`flex-1 py-1.5 rounded text-xs font-semibold border transition-colors ${
                              resultForm[type].needsTherapy === false
                                ? 'bg-green-100 border-green-300 text-green-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Tidak Perlu
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Catatan {type}
                        </label>
                        <textarea
                          value={resultForm[type].notes}
                          onChange={(e) =>
                            setResultForm((prev) => ({
                              ...prev,
                              [type]: { ...prev[type], notes: e.target.value },
                            }))
                          }
                          rows={2}
                          placeholder={`Catatan hasil asesmen ${type}...`}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => { setShowResultModal(false); setSelectedAssessment(null); }}
                disabled={resultSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveResult}
                disabled={resultSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
              >
                {resultSaving ? 'Menyimpan...' : 'Simpan Hasil'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Crop Photo Modal */}
      {cropSrc && (
        <Dialog open onOpenChange={(o) => { if (!o && !photoUploading) setCropSrc(null); }}>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Atur Foto Profil</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500 -mt-2 mb-3">
              Geser dan resize kotak untuk memilih bagian yang akan dijadikan foto profil.
            </p>
            <div className="flex justify-center bg-gray-100 rounded-xl overflow-hidden max-h-[420px]">
              <ReactCrop
                crop={crop}
                onChange={(_, pct) => setCrop(pct)}
                onComplete={(_, pct) => setCompletedCrop(pct)}
                aspect={1}
                circularCrop
                minWidth={20}
                keepSelection
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={cropSrc}
                  alt="Preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: 420, maxWidth: "100%", display: "block" }}
                />
              </ReactCrop>
            </div>
            {photoError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 mt-2">{photoError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCropSrc(null)} disabled={photoUploading}>
                Batal
              </Button>
              <Button onClick={handleCropConfirm} disabled={photoUploading || !completedCrop}>
                {photoUploading ? "Mengupload..." : "Simpan Foto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal */}
      {showEdit && editForm && (
        <Dialog open onOpenChange={(o) => !o && setShowEdit(false)}>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Edit Data Anak</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Nama</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => f && { ...f, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Jenis Kelamin</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm((f) => f && { ...f, gender: e.target.value as "male" | "female" })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Tanggal Lahir</label>
                <DatePicker
                  value={editForm.dateOfBirth}
                  onChange={(val) => setEditForm((f) => f && { ...f, dateOfBirth: val })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Diagnosa / Kondisi <span className="text-gray-400 font-normal">(pisahkan dengan koma)</span>
                </label>
                <Input
                  value={editForm.conditions}
                  onChange={(e) => setEditForm((f) => f && { ...f, conditions: e.target.value })}
                  placeholder="cth: Autisme, ADHD"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Obat-obatan <span className="text-gray-400 font-normal">(pisahkan dengan koma)</span>
                </label>
                <Input
                  value={editForm.medications}
                  onChange={(e) => setEditForm((f) => f && { ...f, medications: e.target.value })}
                  placeholder="cth: Ritalin 10mg"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Alergi <span className="text-gray-400 font-normal">(pisahkan dengan koma)</span>
                </label>
                <Input
                  value={editForm.allergies}
                  onChange={(e) => setEditForm((f) => f && { ...f, allergies: e.target.value })}
                  placeholder="cth: Penisilin"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Catatan Medis</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => f && { ...f, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Catatan tambahan..."
                />
              </div>
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{saveError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEdit(false)} disabled={saving}>Batal</Button>
              <Button onClick={handleSave} disabled={saving || !editForm.name || !editForm.dateOfBirth}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
