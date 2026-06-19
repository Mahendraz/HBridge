"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface ChildDetail {
  id: string;
  name: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  isActive: boolean;
  createdAt: string;
  parent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  therapist?: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
    clinic?: string;
  };
  medicalInfo?: {
    conditions: string[];
    medications: string[];
    allergies: string[];
    notes: string;
  };
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [child, setChild] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state (admin only)
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    dateOfBirth: string;
    gender: "male" | "female";
    conditions: string;
    medications: string;
    allergies: string;
    notes: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchChild();
  }, [id]);

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
      } else {
        setError(result.error || result.message || "Gagal memuat data anak.");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setShowEdit(false);
        fetchChild();
      } else {
        const detail = result.details?.[0]?.message || result.error || result.message || "Gagal menyimpan.";
        setSaveError(detail);
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

  const status = child.isActive ? "active" : "inactive";
  const formattedDOB = child.dateOfBirth
    ? new Date(child.dateOfBirth).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

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
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{child.name}</h1>
              <Badge variant={status === "active" ? "default" : "secondary"}>
                {status === "active" ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {child.age} tahun &bull;{" "}
              {child.gender === "male" ? "Laki-laki" : "Perempuan"}
            </p>
          </div>
        </div>
        {user?.role === "admin" && (
          <Button size="sm" onClick={openEdit}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Data
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info Dasar + Medical */}
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
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Tanggal Lahir
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  {formattedDOB}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Usia
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {child.age} tahun
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Jenis Kelamin
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {child.gender === "male" ? "Laki-laki" : "Perempuan"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Status
                </p>
                <Badge variant={status === "active" ? "default" : "secondary"}>
                  {status === "active" ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
              {child.createdAt && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Terdaftar Sejak
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(child.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
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
              {/* Conditions */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Diagnosa / Kondisi
                </p>
                {child.medicalInfo?.conditions && child.medicalInfo.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {child.medicalInfo.conditions.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-teal-700 border-teal-300">
                        {c}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Belum ada diagnosa</p>
                )}
              </div>

              {/* Medications */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Obat-obatan
                </p>
                {child.medicalInfo?.medications && child.medicalInfo.medications.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {child.medicalInfo.medications.map((m, i) => (
                      <li key={i} className="text-sm text-gray-900">{m}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic">Tidak ada</p>
                )}
              </div>

              {/* Allergies */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Alergi
                </p>
                {child.medicalInfo?.allergies && child.medicalInfo.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {child.medicalInfo.allergies.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-red-700 border-red-300">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Tidak ada</p>
                )}
              </div>

              {/* Notes */}
              {child.medicalInfo?.notes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Catatan Medis
                  </p>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                    {child.medicalInfo.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Orang Tua + Terapis */}
        <div className="space-y-6">
          {/* Orang Tua */}
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

          {/* Terapis */}
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

      {/* Edit Modal — admin only */}
      {showEdit && editForm && (
        <Dialog open onOpenChange={(o) => !o && setShowEdit(false)}>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Edit Data Anak</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Name + Gender */}
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

              {/* Date of Birth — full width so the 3 dropdowns have enough room */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Tanggal Lahir</label>
                <DatePicker
                  value={editForm.dateOfBirth}
                  onChange={(val) => setEditForm((f) => f && { ...f, dateOfBirth: val })}
                />
              </div>

              {/* Conditions */}
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

              {/* Medications */}
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

              {/* Allergies */}
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

              {/* Notes */}
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
              <Button variant="outline" onClick={() => setShowEdit(false)} disabled={saving}>
                Batal
              </Button>
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
