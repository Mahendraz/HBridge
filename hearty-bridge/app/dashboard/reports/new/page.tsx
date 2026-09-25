"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { useReportDraft } from "@/lib/hooks/useReportDraft";
import { useReportMediaUploader, ReportMediaField } from "@/components/reports/report-media-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeftIcon,
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
  const [savingAs, setSavingAs] = useState<"draft" | "completed" | null>(null);
  const [waitingUploads, setWaitingUploads] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  // Media uploads start as soon as a file is picked, but they need a report to
  // attach to — so the first pick creates a draft report on the server, and
  // saving then updates that draft instead of creating a new one.
  const [draftReportId, setDraftReportId] = useState<string | null>(null);
  const draftReportPromise = useRef<Promise<string> | null>(null);

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

  const buildPayload = (statusToSave: "draft" | "completed"): Record<string, unknown> => ({
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
  });

  const createDraftReport = (): Promise<string> => {
    draftReportPromise.current ??= (async () => {
      const token = localStorage.getItem("token") || "";
      const payload = buildPayload("draft");
      if (!payload.title) {
        payload.title = `Laporan ${form.childName || "Sesi"}${form.dueDate ? ` — ${formatDisplayDate(form.dueDate)}` : ""}`;
      }
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || "Gagal menyiapkan draf laporan untuk upload.");
      }
      const id: string = result.data._id;
      setDraftReportId(id);
      // Point the local text draft at the server draft, so opening "new
      // report" later doesn't restore it and create a second report.
      draftHook.save({ ...form, status: "draft", editingId: id, savedAt: new Date().toISOString() });
      return id;
    })().catch((err) => {
      draftReportPromise.current = null; // let the next upload retry
      throw err;
    });
    return draftReportPromise.current;
  };

  const media = useReportMediaUploader({
    getReportId: createDraftReport,
    beforeAdd: () => (form.childId ? null : "Pilih pasien terlebih dahulu sebelum menambahkan media."),
  });

  const handleBack = async () => {
    // The draft may still be being created (first file just picked) — wait for
    // it so it can be discarded instead of left behind.
    let pendingDraftId = draftReportId;
    if (!pendingDraftId && draftReportPromise.current) {
      pendingDraftId = await draftReportPromise.current.catch(() => null);
    }
    if (pendingDraftId) {
      const discard = confirm(
        "Media sudah diunggah ke draf laporan ini.\n\nOK = hapus draf beserta medianya\nBatal = simpan sebagai draf"
      );
      if (discard) {
        await media.discardNew();
        await fetch(`/api/reports/${pendingDraftId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        }).catch(() => {});
      }
      draftHook.clear();
      router.back();
      return;
    }
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
      // Media was uploaded in the background while the form was being filled,
      // so most of it is done by now. Wait for the rest before saving, so a
      // "completed" report never reaches the parent with media still missing.
      setWaitingUploads(true);
      const { failed } = await media.waitForUploads();
      setWaitingUploads(false);
      if (failed > 0) {
        throw new Error(`${failed} file gagal diunggah. Coba lagi atau hapus file tersebut sebelum menyimpan.`);
      }

      const payload = buildPayload(statusToSave);
      const res = await fetch(draftReportId ? `/api/reports/${draftReportId}` : "/api/reports", {
        method: draftReportId ? "PUT" : "POST",
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
  // buildPayload is recreated every render from `form` + URL params, both covered here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, draftReportId, media, draftHook, router]);

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
          className="-m-2 rounded-md p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          title="Kembali"
          aria-label="Kembali"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">
            Laporan /{" "}
            <span className="font-medium text-gray-700">Buat Laporan Baru</span>
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Buat Laporan Baru</h1>
        </div>
      </div>

      {/* Patient header – shown when a patient was selected from the picker */}
      {urlChildId && urlChildName && (
        <div className="flex items-center gap-3 sm:gap-4 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 sm:px-5 sm:py-4">
          <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-teal-600 flex items-center justify-center text-white text-base sm:text-lg font-bold flex-shrink-0">
            {getInitials(urlChildName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-0.5">
              Pasien
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{urlChildName}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              {urlDiagnosis && (
                <p className="text-sm text-gray-600 break-words">
                  <span className="font-medium">Diagnosis:</span> {urlDiagnosis}
                </p>
              )}
              {urlTherapistName && (
                <p className="text-sm text-gray-600 break-words">
                  <span className="font-medium">Terapis:</span> {urlTherapistName}
                </p>
              )}
              {urlSessionDate && (
                <p className="text-sm text-gray-600 break-words">
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
            disabled={!!draftReportId}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1 border border-teal-300 rounded px-2 py-1 hover:bg-teal-100 transition-colors flex-shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            title={draftReportId ? "Pasien tidak bisa diganti setelah media diunggah" : "Pilih pasien lain"}
          >
            <UserIcon className="h-3.5 w-3.5" />
            Ganti
          </button>
        </div>
      )}

      <Card>
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Nama Anak – shown when NOT pre-selected from URL picker; prominent */}
          {!urlChildId && (
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-1.5 block">
                Nama Anak / Pasien <span className="text-red-500">*</span>
              </label>
              <select
                value={form.childId}
                onChange={(e) => handleChildChange(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-50"
                disabled={loadingChildren || !!draftReportId}
                title={draftReportId ? "Pasien tidak bisa diganti setelah media diunggah" : undefined}
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

          {/* Media — uploads start immediately on pick/drop */}
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
