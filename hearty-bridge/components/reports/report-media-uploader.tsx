"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  UploadIcon,
  XIcon,
  VideoIcon,
  ImageIcon,
  RotateCwIcon,
  CheckIcon,
  Loader2Icon,
} from "lucide-react";
import { uploadFileWithProgress, UploadAbortedError } from "@/lib/utils/upload-with-progress";
import {
  REPORT_MEDIA_ACCEPT,
  REPORT_MEDIA_MIME_TYPES,
  mediaKind,
  resolveMimeType,
} from "@/lib/utils/media-mime";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ServerMediaFile {
  fileName: string;
  fileType: "image" | "video" | "document";
  gcsPath: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  processingStatus?: "ready" | "processing";
  uploadId?: string;
}

type ItemStatus = "queued" | "uploading" | "done" | "error";

interface MediaItem {
  id: string;
  fileName: string;
  kind: "image" | "video" | "document";
  previewUrl: string | null;
  status: ItemStatus;
  loaded: number;
  total: number;
  error?: string;
  uploadId?: string;
  gcsPath?: string;
  processing?: boolean;
  /** Uploaded during this visit to the form (as opposed to loaded from the server). */
  isNew: boolean;
}

interface UploadJob {
  file: File;
  controller: AbortController;
  /** Whole request body has been sent — aborting now wouldn't stop the server. */
  bodySent: boolean;
  /** Removed by the user after the body was sent: delete once the server responds. */
  removeWhenDone: boolean;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // matches the server limit
const MAX_PARALLEL_UPLOADS = 2;

function newUploadId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getToken(): string {
  return typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
}

function fromServer(m: ServerMediaFile): MediaItem {
  return {
    id: m.uploadId ?? m.gcsPath,
    fileName: m.fileName,
    kind: m.fileType,
    previewUrl: m.fileType === "image" ? m.url : null,
    status: "done",
    loaded: m.size,
    total: m.size,
    uploadId: m.uploadId,
    gcsPath: m.gcsPath,
    processing: m.processingStatus === "processing",
    isNew: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Uploads report media the moment files are picked or dropped (TRP-1), in
 * the background, at most two at a time. By the time the therapist presses
 * save most files are already on the server; `waitForUploads()` covers the
 * rest. Files can be removed at any point — queued ones are dropped, in-
 * flight ones aborted, finished ones deleted from the report.
 *
 * `getReportId` is called before each upload: the edit page returns its id,
 * the new-report page creates a draft report on first call.
 */
export function useReportMediaUploader({
  getReportId,
  beforeAdd,
}: {
  getReportId: () => Promise<string>;
  /** Return an error message to block adding files (e.g. no patient selected yet). */
  beforeAdd?: () => string | null;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const jobs = useRef(new Map<string, UploadJob>());
  const queue = useRef<string[]>([]);
  const active = useRef(0);
  const failed = useRef(new Set<string>());
  const idleWaiters = useRef<(() => void)[]>([]);
  const objectUrls = useRef(new Map<string, string>());
  const reportIdRef = useRef<string | null>(null);

  // Latest callbacks without re-creating the upload machinery every render
  const getReportIdRef = useRef(getReportId);
  const beforeAddRef = useRef(beforeAdd);
  useEffect(() => {
    getReportIdRef.current = getReportId;
    beforeAddRef.current = beforeAdd;
  });

  const patchItem = useCallback((id: string, patch: Partial<MediaItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const releasePreview = useCallback((id: string) => {
    const url = objectUrls.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      objectUrls.current.delete(id);
    }
  }, []);

  const deleteOnServer = useCallback(async (item: { uploadId?: string; gcsPath?: string }) => {
    const reportId = reportIdRef.current ?? (await getReportIdRef.current());
    const query = item.uploadId
      ? `uploadId=${encodeURIComponent(item.uploadId)}`
      : `fileName=${encodeURIComponent(item.gcsPath ?? "")}`;
    const res = await fetch(`/api/reports/${reportId}/media?${query}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error("Gagal menghapus file.");
  }, []);

  const flushIdleWaiters = useCallback(() => {
    if (active.current === 0 && queue.current.length === 0) {
      const waiters = idleWaiters.current;
      idleWaiters.current = [];
      waiters.forEach((resolve) => resolve());
    }
  }, []);

  const pumpRef = useRef<() => void>(() => {});

  const runJob = useCallback(async (id: string) => {
    const job = jobs.current.get(id);
    if (!job) return;
    active.current += 1;
    failed.current.delete(id);
    patchItem(id, { status: "uploading", loaded: 0, error: undefined });

    try {
      const reportId = await getReportIdRef.current();
      reportIdRef.current = reportId;

      const fd = new FormData();
      fd.append("file", job.file);
      fd.append("uploadId", id);
      const body = (await uploadFileWithProgress(
        `/api/reports/${reportId}/media`,
        fd,
        getToken(),
        (loaded) => {
          if (loaded >= job.file.size) job.bodySent = true;
          patchItem(id, { loaded });
        },
        job.controller.signal
      )) as { data?: ServerMediaFile } | null;

      if (job.removeWhenDone) {
        await deleteOnServer({ uploadId: id }).catch(() => {});
      } else {
        patchItem(id, {
          status: "done",
          loaded: job.file.size,
          uploadId: id,
          gcsPath: body?.data?.gcsPath,
          processing: body?.data?.processingStatus === "processing",
        });
      }
      jobs.current.delete(id);
    } catch (err) {
      if (!(err instanceof UploadAbortedError) && !job.removeWhenDone) {
        failed.current.add(id);
        patchItem(id, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload gagal.",
        });
      }
      // Keep the job (and its File) around so "Coba lagi" can re-queue it,
      // unless it was aborted/removed on purpose.
      if (err instanceof UploadAbortedError || job.removeWhenDone) jobs.current.delete(id);
      else job.controller = new AbortController();
    } finally {
      active.current -= 1;
      pumpRef.current();
      flushIdleWaiters();
    }
  }, [patchItem, deleteOnServer, flushIdleWaiters]);

  const pump = useCallback(() => {
    while (active.current < MAX_PARALLEL_UPLOADS && queue.current.length > 0) {
      const id = queue.current.shift()!;
      void runJob(id);
    }
  }, [runJob]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const blocked = beforeAddRef.current?.();
    if (blocked) {
      setNotice(blocked);
      return;
    }

    const rejected: string[] = [];
    const accepted: MediaItem[] = [];
    for (const file of files) {
      const mimeType = resolveMimeType(file.type, file.name);
      if (!REPORT_MEDIA_MIME_TYPES.has(mimeType)) {
        rejected.push(`${file.name}: format tidak didukung`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: lebih dari 100 MB`);
        continue;
      }
      const id = newUploadId();
      const kind = mediaKind(mimeType);
      let previewUrl: string | null = null;
      if (kind === "image") {
        previewUrl = URL.createObjectURL(file);
        objectUrls.current.set(id, previewUrl);
      }
      jobs.current.set(id, { file, controller: new AbortController(), bodySent: false, removeWhenDone: false });
      queue.current.push(id);
      accepted.push({
        id,
        fileName: file.name,
        kind,
        previewUrl,
        status: "queued",
        loaded: 0,
        total: file.size,
        isNew: true,
      });
    }

    setNotice(rejected.length > 0 ? `Tidak diunggah — ${rejected.join("; ")}` : null);
    if (accepted.length > 0) {
      setItems((prev) => [...prev, ...accepted]);
      pump();
    }
  }, [pump]);

  const remove = useCallback(async (item: MediaItem) => {
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    releasePreview(item.id);
    failed.current.delete(item.id);

    const job = jobs.current.get(item.id);
    if (item.status === "queued") {
      queue.current = queue.current.filter((q) => q !== item.id);
      jobs.current.delete(item.id);
      flushIdleWaiters();
      return;
    }
    if (item.status === "uploading" && job) {
      if (job.bodySent) job.removeWhenDone = true;
      else job.controller.abort();
      return;
    }
    if (item.status === "error") {
      jobs.current.delete(item.id);
      return;
    }

    try {
      await deleteOnServer(item);
    } catch {
      setNotice(`Gagal menghapus ${item.fileName}. Coba lagi.`);
      setItems((prev) => [...prev, item]);
    }
  }, [deleteOnServer, releasePreview, flushIdleWaiters]);

  const retry = useCallback((item: MediaItem) => {
    if (!jobs.current.has(item.id)) return;
    failed.current.delete(item.id);
    patchItem(item.id, { status: "queued", error: undefined, loaded: 0 });
    queue.current.push(item.id);
    pump();
  }, [patchItem, pump]);

  /** Load media already attached to the report (edit page). */
  const setExisting = useCallback((media: ServerMediaFile[]) => {
    setItems((prev) => [...media.map(fromServer), ...prev.filter((it) => it.isNew)]);
  }, []);

  /** Resolves once every queued/in-flight upload has finished; returns how many failed. */
  const waitForUploads = useCallback((): Promise<{ failed: number }> => {
    return new Promise((resolve) => {
      const done = () => resolve({ failed: failed.current.size });
      if (active.current === 0 && queue.current.length === 0) done();
      else idleWaiters.current.push(done);
    });
  }, []);

  /** Aborts pending uploads and deletes everything uploaded during this visit. */
  const discardNew = useCallback(async (): Promise<void> => {
    queue.current = [];
    jobs.current.forEach((job) => {
      if (job.bodySent) job.removeWhenDone = true;
      else job.controller.abort();
    });
    const uploaded = items.filter((it) => it.isNew && it.status === "done");
    setItems((prev) => prev.filter((it) => !it.isNew));
    await Promise.allSettled(uploaded.map((it) => deleteOnServer(it)));
    await waitForUploads();
  }, [items, deleteOnServer, waitForUploads]);

  // Abort in-flight uploads and free previews when the form unmounts
  useEffect(() => {
    const jobMap = jobs.current;
    const urls = objectUrls.current;
    return () => {
      jobMap.forEach((job) => job.controller.abort());
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const pendingItems = items.filter((it) => it.status === "queued" || it.status === "uploading");
  const pendingTotal = pendingItems.reduce((sum, it) => sum + it.total, 0);
  const pendingLoaded = pendingItems.reduce((sum, it) => sum + it.loaded, 0);

  return {
    items,
    notice,
    setNotice,
    addFiles,
    remove,
    retry,
    setExisting,
    waitForUploads,
    discardNew,
    pendingCount: pendingItems.length,
    pendingPercent: pendingTotal > 0 ? Math.round((pendingLoaded / pendingTotal) * 100) : 100,
    failedCount: items.filter((it) => it.status === "error").length,
    newUploadedCount: items.filter((it) => it.isNew && it.status === "done").length,
  };
}

export type ReportMediaUploader = ReturnType<typeof useReportMediaUploader>;

// ─────────────────────────────────────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────────────────────────────────────
function Thumb({ item }: { item: MediaItem }) {
  const [broken, setBroken] = useState(false);

  if (item.kind === "image" && item.previewUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local object URL / signed R2 URL
      <img
        src={item.previewUrl}
        alt={item.fileName}
        className="w-full h-20 object-cover"
        onError={() => setBroken(true)}
      />
    );
  }

  const Icon = item.kind === "video" ? VideoIcon : ImageIcon;
  return (
    <div className="flex flex-col items-center justify-center h-20 bg-gray-100">
      <Icon className="h-6 w-6 text-gray-400 mb-1" />
      <p className="text-[10px] text-gray-500">{item.kind === "video" ? "Video" : "Foto"}</p>
    </div>
  );
}

export function ReportMediaField({
  uploader,
  label = "Media (Foto / Video)",
  disabled,
}: {
  uploader: ReportMediaUploader;
  label?: string;
  disabled?: boolean;
}) {
  const { items, notice, addFiles, remove, retry, pendingCount, pendingPercent } = uploader;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    addFiles(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    addFiles(Array.from(e.dataTransfer.files || []));
  };

  return (
    <div>
      <label className="text-xs font-medium text-gray-700 mb-2 block">
        {label}{" "}
        {items.length > 0 && <span className="text-gray-500">— {items.length} file</span>}
      </label>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {items.map((item) => {
            const percent = item.total > 0 ? Math.round((item.loaded / item.total) * 100) : 0;
            return (
              <div
                key={item.id}
                className={`relative border rounded-lg overflow-hidden ${
                  item.status === "error"
                    ? "border-red-300 bg-red-50"
                    : item.status === "done"
                    ? "border-gray-200 bg-gray-50"
                    : "border-dashed border-teal-300 bg-teal-50"
                }`}
              >
                <Thumb item={item} />

                <div className="px-2 py-1">
                  <p className="text-[10px] text-gray-600 truncate">{item.fileName}</p>
                  {item.status === "queued" && (
                    <p className="text-[10px] text-gray-400">Menunggu giliran…</p>
                  )}
                  {item.status === "uploading" && (
                    <div className="mt-0.5">
                      <div className="w-full h-1 bg-teal-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 transition-all duration-200"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-teal-700 mt-0.5">
                        {percent < 100 ? `Mengunggah ${percent}%` : "Memproses…"}
                      </p>
                    </div>
                  )}
                  {item.status === "done" && (
                    <p className="text-[10px] text-green-700 flex items-center gap-0.5">
                      {item.processing ? (
                        <>
                          <Loader2Icon className="h-2.5 w-2.5 animate-spin" /> Terunggah, sedang dikonversi
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-2.5 w-2.5" /> Terunggah
                        </>
                      )}
                    </p>
                  )}
                  {item.status === "error" && (
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] text-red-600 truncate" title={item.error}>
                        {item.error}
                      </p>
                      <button
                        type="button"
                        onClick={() => retry(item)}
                        className="text-[10px] text-red-700 hover:text-red-900 font-medium flex items-center gap-0.5 flex-shrink-0"
                      >
                        <RotateCwIcon className="h-2.5 w-2.5" /> Coba lagi
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  onClick={() => remove(item)}
                  title="Hapus"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={REPORT_MEDIA_ACCEPT}
        className="hidden"
        onChange={handlePick}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-lg py-3 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50 ${
            dragging
              ? "border-teal-500 text-teal-700 bg-teal-50"
              : "border-gray-300 text-gray-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50"
          }`}
        >
          <UploadIcon className="h-4 w-4" />
          {dragging ? "Lepaskan file di sini" : "Pilih atau seret foto/video ke sini (maks. 100 MB per file)"}
        </button>
      </div>

      {notice && <p className="text-xs text-amber-700 mt-1">{notice}</p>}

      {pendingCount > 0 ? (
        <p className="text-xs text-teal-700 mt-1">
          Mengunggah {pendingCount} file di latar belakang ({pendingPercent}%). Anda bisa lanjut mengisi form.
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1">
          File langsung diunggah begitu dipilih. Termasuk video/foto iPhone (.mov, .heic).
        </p>
      )}
    </div>
  );
}
