"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { useReportDraft } from "@/lib/hooks/useReportDraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftIcon,
  UploadIcon,
  XIcon,
  VideoIcon,
  EyeIcon,
  AlertCircleIcon,
  SaveIcon,
  CalendarIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface ChildOption {
  _id: string;
  name: string;
}

interface MediaFile {
  fileName: string;
  fileType: "image" | "video" | "document";
  gcsPath: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface FormState {
  title: string;
  description: string;
  content: string;
  childId: string;
  childName: string;
  dueDate: string;
}

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function EditReportPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const { user } = useAuth();
  const draftHook = useReportDraft();

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    content: "",
    childId: "",
    childName: "",
    dueDate: "",
  });
  const [allChildren, setAllChildren] = useState<ChildOption[]>([]);
  const [existingMedia, setExistingMedia] = useState<MediaFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [savingAs, setSavingAs] = useState<"draft" | "completed" | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // draft banner: 'prompt' | null
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  // Auth guard – parent cannot edit reports
  useEffect(() => {
    if (user && user.role === "parent") {
      router.replace("/dashboard/reports");
    }
  }, [user, router]);

  // Fetch children list and report data in parallel
  useEffect(() => {
    if (!reportId) return;

    const fetchData = async () => {
      const [childrenRes, reportRes] = await Promise.allSettled([
        fetch("/api/children", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/reports/${reportId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (childrenRes.status === "fulfilled" && childrenRes.value.ok) {
        const result = await childrenRes.value.json();
        setAllChildren(
          (result.children || []).map((c: any) => ({
            _id: c.id || c._id,
            name: c.name,
          }))
        );
      }

      if (reportRes.status === "fulfilled") {
        if (!reportRes.value.ok) {
          setNotFound(true);
          setLoadingReport(false);
          return;
        }
        const reportResult = await reportRes.value.json();
        if (!reportResult.success || !reportResult.data) {
          setNotFound(true);
          setLoadingReport(false);
          return;
        }
        const report = reportResult.data;
        setExistingMedia(report.mediaFiles || []);

        const serverForm: FormState = {
          title: report.title || "",
          description: report.description || "",
          content: report.content || "",
          childId: report.childId || "",
          childName: report.childName || "",
          dueDate: report.dueDate ? report.dueDate.substring(0, 10) : "",
        };

        // Check if there's a local draft that's newer than the server version
        const localDraft = draftHook.draft;
        const hasFresherDraft =
          localDraft &&
          localDraft.editingId === reportId &&
          new Date(localDraft.savedAt) > new Date(report.updatedAt || 0);

        setForm(serverForm);
        if (hasFresherDraft) {
          setShowDraftBanner(true);
        }
        setLoadingReport(false);
      } else {
        setNotFound(true);
        setLoadingReport(false);
      }
    };

    fetchData().catch(() => {
      setNotFound(true);
      setLoadingReport(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, token]);

  // Auto-save form changes to localStorage (debounced 800ms)
  useEffect(() => {
    if (loadingReport) return;
    const timer = setTimeout(() => {
      draftHook.save({
        ...form,
        status: "draft",
        editingId: reportId,
        savedAt: new Date().toISOString(),
      });
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, loadingReport, reportId]);

  const applyLocalDraft = () => {
    const localDraft = draftHook.draft;
    if (!localDraft) return;
    setForm({
      title: localDraft.title || "",
      description: localDraft.description || "",
      content: localDraft.content || "",
      childId: localDraft.childId || "",
      childName: localDraft.childName || "",
      dueDate: localDraft.dueDate || "",
    });
    setShowDraftBanner(false);
  };

  const loadServerData = () => {
    draftHook.clear();
    setShowDraftBanner(false);
  };

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

  const handleDeleteExisting = async (gcsPath: string) => {
    if (!reportId) return;
    try {
      await fetch(
        `/api/reports/${reportId}/media?fileName=${encodeURIComponent(gcsPath)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setExistingMedia((prev) => prev.filter((m) => m.gcsPath !== gcsPath));
    } catch {
      // ignore
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = useCallback(async (statusToSave: "draft" | "completed") => {
    if (!form.title.trim() || !form.childId) {
      setSaveError("Judul dan pasien wajib diisi.");
      return;
    }

    setSavingAs(statusToSave);
    setSaveError(null);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        content: form.content.trim(),
        status: statusToSave,
        childId: form.childId,
        childName: form.childName,
        dueDate: form.dueDate || undefined,
      };

      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Gagal menyimpan laporan.");
      }

      // Upload new pending files
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
  }, [form, pendingFiles, reportId, token, draftHook, router]);

  // ── Render states ──────────────────────────────────────────────────────────
  if (user?.role === "parent") return null;

  if (loadingReport) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-500">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-600">Laporan tidak ditemukan.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/reports")}>
          Kembali ke Daftar
        </Button>
      </div>
    );
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
            <span className="font-medium text-gray-700">Edit Laporan</span>
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Edit Laporan</h1>
        </div>
      </div>

      {/* Draft banner */}
      {showDraftBanner && draftHook.draft && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircleIcon className="h-4 w-4 flex-shrink-0" />
            <span>
              Ada perubahan lokal yang belum tersimpan{" "}
              <span className="font-semibold">
                (disimpan {formatSavedAt(draftHook.draft.savedAt)})
              </span>
              . Lanjutkan dari draf lokal?
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={applyLocalDraft}
              className="text-xs font-medium px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Lanjutkan Draf
            </button>
            <button
              onClick={loadServerData}
              className="text-xs font-medium px-3 py-1.5 border border-yellow-400 text-yellow-700 rounded hover:bg-yellow-100 transition-colors"
            >
              Muat Data Server
            </button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Pasien – prominent */}
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
              Nama Anak / Pasien <span className="text-red-500">*</span>
            </label>
            <select
              value={form.childId}
              onChange={(e) => handleChildChange(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Pilih pasien...</option>
              {allChildren.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

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

          {/* Media Section */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block">
              Media (Foto / Video){" "}
              {(existingMedia.length + pendingFiles.length) > 0 && (
                <span className="text-gray-500">
                  — {existingMedia.length + pendingFiles.length} file
                </span>
              )}
            </label>

            {/* Existing media from server */}
            {existingMedia.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">File tersimpan:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {existingMedia.map((m) => (
                    <div
                      key={m.gcsPath}
                      className="relative border rounded-lg overflow-hidden bg-gray-50"
                    >
                      {m.fileType === "image" ? (
                        <img
                          src={m.url}
                          alt={m.fileName}
                          className="w-full h-20 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-20 bg-gray-100">
                          <VideoIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="px-2 py-1">
                        <p className="text-[10px] text-gray-600 truncate">{m.fileName}</p>
                      </div>
                      <button
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        onClick={() => handleDeleteExisting(m.gcsPath)}
                        title="Hapus"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-1 right-1 bg-white border rounded p-0.5 hover:bg-gray-50"
                        title="Buka"
                      >
                        <EyeIcon className="h-3 w-3 text-gray-500" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New pending files */}
            {pendingFiles.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">File baru (belum diunggah):</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pendingFiles.map(({ file, preview }, idx) => (
                    <div
                      key={idx}
                      className="relative border border-dashed border-teal-300 rounded-lg overflow-hidden bg-teal-50"
                    >
                      {preview ? (
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
              Tambah foto atau video (maks. 100 MB per file)
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
