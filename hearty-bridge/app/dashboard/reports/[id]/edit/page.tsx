"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { useReportDraft } from "@/lib/hooks/useReportDraft";
import { useReportMediaUploader, ReportMediaField } from "@/components/reports/report-media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftIcon,
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
  const permissions = usePermissions(user?.role ?? "parent");
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
  const [savingAs, setSavingAs] = useState<"draft" | "completed" | null>(null);
  const [waitingUploads, setWaitingUploads] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // draft banner: 'prompt' | null
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Uploads start as soon as files are picked/dropped, straight onto this report
  const media = useReportMediaUploader({ getReportId: async () => reportId });
  const { setExisting } = media;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  // Auth guard – parent cannot edit reports
  useEffect(() => {
    if (user && !permissions.hasPermission("reports:create")) {
      router.replace("/dashboard/reports");
    }
  }, [user, permissions, router]);

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
        setExisting(report.mediaFiles || []);

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

  const handleBack = async () => {
    if (media.newUploadedCount > 0 || media.pendingCount > 0) {
      const discard = confirm(
        "File yang baru ditambahkan sudah diunggah ke laporan ini.\n\nOK = batalkan & hapus file baru tersebut\nBatal = biarkan file tetap tersimpan"
      );
      if (discard) await media.discardNew();
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

    try {
      // Media uploads have been running in the background; wait for any
      // still in flight before saving (and publishing, if "completed").
      setWaitingUploads(true);
      const { failed } = await media.waitForUploads();
      setWaitingUploads(false);
      if (failed > 0) {
        throw new Error(`${failed} file gagal diunggah. Coba lagi atau hapus file tersebut sebelum menyimpan.`);
      }

      // Media removed in the form is only deleted now, on save.
      const removal = await media.commitRemovals();
      if (removal.failed > 0) {
        throw new Error(`${removal.failed} file gagal dihapus. Coba simpan lagi.`);
      }

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

      draftHook.clear();
      router.push("/dashboard/reports");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setWaitingUploads(false);
      setSavingAs(null);
    }
  }, [form, media, reportId, token, draftHook, router]);

  // ── Render states ──────────────────────────────────────────────────────────
  if (!permissions.hasPermission("reports:create")) return null;

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
        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            Laporan /{" "}
            <span className="font-medium text-gray-700">Edit Laporan</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Laporan</h1>
        </div>
      </div>

      {/* Draft banner */}
      {showDraftBanner && draftHook.draft && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2 text-sm text-yellow-800">
            <AlertCircleIcon className="h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span>
              Ada perubahan lokal yang belum tersimpan{" "}
              <span className="font-semibold">
                (disimpan {formatSavedAt(draftHook.draft.savedAt)})
              </span>
              . Lanjutkan dari draf lokal?
            </span>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
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
        <CardContent className="p-4 sm:p-6 space-y-5">
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

          {/* Media Section — uploads start immediately on pick/drop */}
          <ReportMediaField uploader={media} disabled={isSaving} />

          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {waitingUploads && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Menunggu upload media selesai...</span>
                <span>{media.pendingPercent}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all duration-200"
                  style={{ width: `${media.pendingPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-4 border-t border-gray-200">
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
