"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { useReportDraft } from "@/lib/hooks/useReportDraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  UploadIcon,
  XIcon,
  VideoIcon,
  SaveIcon,
  UserIcon,
  CalendarIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return `${d} ${months[m - 1]} ${y}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ChildOption {
  _id: string;
  name: string;
}

interface FormState {
  title: string;
  description: string;
  content: string;
  childId: string;
  childName: string;
  dueDate: string;
  type: "progress" | "assessment" | "hero_bridge";
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  content: "",
  childId: "",
  childName: "",
  dueDate: "",
  type: "progress",
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const draftHook = useReportDraft();

  // Patient info passed from the picker (URL search params)
  const urlChildId       = searchParams.get("childId")       || "";
  const urlChildName     = searchParams.get("childName")     || "";
  const urlDiagnosis     = searchParams.get("diagnosis")     || "";
  const urlTherapistName = searchParams.get("therapistName") || "";
  // From schedule redirect
  const urlSessionDate  = searchParams.get("sessionDate")  || "";  // YYYY-MM-DD
  const urlSessionHour  = searchParams.get("sessionHour")  || "";  // "9", "10", etc.
  const urlTherapyType  = searchParams.get("therapyType")  || "";  // "OT" / "TW"

  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    childId:   urlChildId,
    childName: urlChildName,
    dueDate:   urlSessionDate || "",  // pre-fill from session date
  });
  const [allChildren, setAllChildren] = useState<ChildOption[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [savingAs, setSavingAs] = useState<"draft" | "completed" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth guard – parent cannot create reports
  useEffect(() => {
    if (user && !permissions.hasPermission("reports:create")) {
      router.replace("/dashboard/reports");
    }
  }, [user, permissions, router]);

  // Fetch children list
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    fetch("/api/children", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((result) => {
        setAllChildren(
          (result.children || []).map((c: any) => ({
            _id: c.id || c._id,
            name: c.name,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoadingChildren(false));
  }, []);

  // Silently pre-fill form from draft on mount (create draft only, no editingId)
  // URL params take priority over draft when a patient was selected from picker
  useEffect(() => {
    const d = draftHook.draft;
    if (d && !d.editingId && !urlChildId) {
      setForm({
        title: d.title || "",
        description: d.description || "",
        content: d.content || "",
        childId: d.childId || "",
        childName: d.childName || "",
        dueDate: d.dueDate || "",
        type: (d.type === 'assessment' ? 'assessment' : d.type === 'hero_bridge' ? 'hero_bridge' : 'progress'),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill title when coming from schedule redirect
  useEffect(() => {
    if (urlChildName && urlSessionDate) {
      setForm((f) => ({
        ...f,
        title: f.title || `Laporan Sesi — ${urlChildName} — ${formatDisplayDate(urlSessionDate)}`,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save form to localStorage (debounced 800ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasContent = form.title || form.content || form.description || form.childId;
      if (hasContent) {
        draftHook.save({
          ...form,
          status: "draft",
          savedAt: new Date().toISOString(),
        });
      }
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const handleChildChange = (childId: string) => {
    const child = allChildren.find((c) => c._id === childId);
    setForm((f) => ({ ...f, childId, childName: child?.name || "" }));
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const preview = (ev.target?.result as string) ?? "";
          setPendingFiles((prev) => [...prev, { file, preview }]);
        };
        reader.readAsDataURL(file);
      } else {
        setPendingFiles((prev) => [...prev, { file, preview: "" }]);
      }
    });
  };

  const removePending = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    const hasContent = form.title || form.content || form.description;
    if (hasContent) {
      if (!confirm("Teks sudah disimpan sebagai draf lokal. Keluar dari halaman ini?")) return;
    }
    router.back();
  };

  const handleSave = useCallback(async (statusToSave: "draft" | "completed") => {
    if (!form.title.trim() || !form.childId) {
      setSaveError("Judul dan pasien wajib diisi.");
      return;
    }

    setSavingAs(statusToSave);
    setSaveError(null);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        content: form.content.trim(),
        type: form.type,
        status: statusToSave,
        childId: form.childId,
        childName: form.childName,
        dueDate: form.dueDate || undefined,
        // From schedule redirect — store session metadata
        ...(urlSessionDate && { sessionDate: urlSessionDate }),
        ...(urlSessionHour && { sessionHour: parseInt(urlSessionHour) }),
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Gagal membuat laporan.");
      }

      const reportId: string = result.data._id;

      // Upload pending media files
      for (const { file } of pendingFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch(`/api/reports/${reportId}/media`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json().catch(() => ({}));
          console.warn("Media upload warning:", uploadErr.error);
        }
      }

      draftHook.clear();
      router.push("/dashboard/reports");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setSavingAs(null);
    }
  }, [form, pendingFiles, draftHook, router]);

  if (!permissions.hasPermission("reports:create")) return null;

  function getInitials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  const isSaving = savingAs !== null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-gray-500 hover:text-gray-800 transition-colors"
          title="Kembali"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs text-gray-500">
            Laporan /{" "}
            <span className="font-medium text-gray-700">Buat Laporan Baru</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Buat Laporan Baru</h1>
        </div>
      </div>

      {/* Patient header – shown when a patient was selected from the picker */}
      {urlChildId && urlChildName && (
        <div className="flex items-center gap-4 bg-teal-50 border border-teal-200 rounded-xl px-5 py-4">
          <div className="h-14 w-14 rounded-full bg-teal-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {getInitials(urlChildName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-0.5">
              Pasien
            </p>
            <p className="text-xl font-bold text-gray-900 truncate">{urlChildName}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              {urlDiagnosis && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Diagnosis:</span> {urlDiagnosis}
                </p>
              )}
              {urlTherapistName && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Terapis:</span> {urlTherapistName}
                </p>
              )}
              {urlSessionDate && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Sesi:</span>{" "}
                  {formatDisplayDate(urlSessionDate)}
                  {urlSessionHour ? ` — jam ${urlSessionHour}:00` : ""}
                  {urlTherapyType ? ` — ${urlTherapyType}` : ""}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.replace("/dashboard/reports/new")}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1 border border-teal-300 rounded px-2 py-1 hover:bg-teal-100 transition-colors flex-shrink-0"
            title="Pilih pasien lain"
          >
            <UserIcon className="h-3.5 w-3.5" />
            Ganti
          </button>
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Nama Anak – shown when NOT pre-selected from URL picker; prominent */}
          {!urlChildId && (
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                Nama Anak / Pasien <span className="text-red-500">*</span>
              </label>
              <select
                value={form.childId}
                onChange={(e) => handleChildChange(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                disabled={loadingChildren}
              >
                <option value="">
                  {loadingChildren ? "Memuat data pasien..." : "Pilih pasien..."}
                </option>
                {allChildren.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Waktu Terapi – prominent */}
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-teal-600" />
              Waktu Terapi
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Jenis Laporan */}
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: 'progress' }))}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
                form.type === 'progress'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: 'assessment' }))}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
                form.type === 'assessment'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Asesmen
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: 'hero_bridge' }))}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
                form.type === 'hero_bridge'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Hero Bridge
            </button>
          </div>

          {/* Judul */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Judul <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Judul laporan..."
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Deskripsi singkat laporan..."
            />
          </div>

          {/* Isi Laporan */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Isi Laporan / Catatan Terapi
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-y min-h-[160px] focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Catatan terapi, perkembangan, observasi..."
            />
          </div>

          {/* Media */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Media (Foto / Video){" "}
              {pendingFiles.length > 0 && (
                <span className="text-gray-500">— {pendingFiles.length} file dipilih</span>
              )}
            </label>

            {pendingFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {pendingFiles.map(({ file, preview }, idx) => (
                  <div
                    key={idx}
                    className="relative border border-dashed border-teal-300 rounded-lg overflow-hidden bg-teal-50"
                  >
                    {file.type.startsWith("image/") ? (
                      <img
                        src={preview}
                        alt={file.name}
                        className="w-full h-20 object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-20">
                        <VideoIcon className="h-6 w-6 text-teal-500 mb-1" />
                        <p className="text-[10px] text-teal-700">Video</p>
                      </div>
                    )}
                    <div className="px-2 py-1">
                      <p className="text-[10px] text-gray-600 truncate">{file.name}</p>
                    </div>
                    <button
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                      onClick={() => removePending(idx)}
                      title="Hapus"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleFilePick}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <UploadIcon className="h-4 w-4" />
              Pilih foto atau video (maks. 100 MB per file)
            </button>

            <p className="text-xs text-gray-400 mt-1">
              Teks form disimpan otomatis. File yang dipilih perlu dipilih ulang jika halaman ditutup.
            </p>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleBack} disabled={isSaving}>
              Batal
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={isSaving}
            >
              {savingAs === "draft" ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Draf"
              )}
            </Button>
            <Button
              onClick={() => handleSave("completed")}
              disabled={isSaving}
            >
              {savingAs === "completed" ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Simpan Laporan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
