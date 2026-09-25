"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangleIcon, Trash2Icon } from "lucide-react";

export interface DeletionTarget {
  type: "parent" | "child";
  id: string;
  name: string;
  /** Parent only: children whose accounts are deleted along with it. */
  childNames?: string[];
}

interface RequestDeletionDialogProps {
  /** Account to delete. `null` = dialog closed. */
  target: DeletionTarget | null;
  /**
   * `true` for Super Admin: deletes right away. Otherwise (Admin) it only
   * files a request that a Super Admin has to approve.
   */
  direct: boolean;
  onClose: () => void;
  /** Called after a successful delete/request so the page can refresh. */
  onDone: () => void;
}

function RequestDeletionBody({ target, direct, onClose, onDone }: Omit<RequestDeletionDialogProps, "target"> & { target: DeletionTarget }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const label = target.type === "parent" ? "orang tua" : "anak";

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const res = direct
        ? await fetch(
            target.type === "parent" ? `/api/admin/users/${target.id}` : `/api/children/${target.id}`,
            { method: "DELETE", headers }
          )
        : await fetch("/api/deletion-requests", {
            method: "POST",
            headers,
            body: JSON.stringify({ targetType: target.type, targetId: target.id, reason: reason.trim() || undefined }),
          });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) {
        setError(result.error || result.message || "Gagal memproses. Coba lagi.");
        return;
      }
      onDone();
      if (direct) onClose();
      else setDone(true);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Permintaan terkirim</DialogTitle>
          <DialogDescription className="break-words">
            Permintaan hapus akun {label} <strong>{target.name}</strong> sudah dikirim. Akun baru terhapus
            setelah Super Admin menyetujuinya.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 leading-snug sm:leading-none">
          <Trash2Icon className="h-5 w-5 text-red-600 shrink-0" />
          {direct ? `Hapus akun ${label}` : `Ajukan hapus akun ${label}`}
        </DialogTitle>
        <DialogDescription className="break-words">
          {direct
            ? <>Akun <strong>{target.name}</strong> akan dihapus sekarang.</>
            : <>Permintaan hapus akun <strong>{target.name}</strong> akan dikirim ke Super Admin untuk disetujui.</>}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 text-sm">
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 flex gap-2">
          <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>Akun tidak bisa login lagi dan hilang dari daftar pasien aktif. Jadwal ke depan dibatalkan.</p>
            <p>Riwayat sesi, laporan, dan invoice tetap tersimpan.</p>
          </div>
        </div>

        {target.type === "parent" && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-700 break-words">
            {target.childNames && target.childNames.length > 0 ? (
              <>Akun anak ikut terhapus: <strong>{target.childNames.join(", ")}</strong></>
            ) : (
              <>Orang tua ini belum punya anak terdaftar.</>
            )}
          </div>
        )}

        {!direct && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Alasan (opsional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Contoh: sudah berhenti terapi"
            />
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-600 break-words">{error}</div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Batal
        </Button>
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Memproses..." : direct ? "Hapus Akun" : "Ajukan Hapus"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function RequestDeletionDialog({ target, direct, onClose, onDone }: RequestDeletionDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        {target && (
          <RequestDeletionBody
            key={`${target.type}:${target.id}`}
            target={target}
            direct={direct}
            onClose={onClose}
            onDone={onDone}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Target ids (parent or child) that already have a pending deletion request,
 * so the page can show "Menunggu persetujuan" instead of another button.
 */
export function usePendingDeletionIds(enabled: boolean) {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const next = await fetchPendingDeletionIds();
    if (next) setIds(next);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchPendingDeletionIds().then((next) => {
      if (!cancelled && next) setIds(next);
    });
    return () => { cancelled = true; };
  }, [enabled]);

  return { pendingIds: ids, refreshPending: refresh };
}

async function fetchPendingDeletionIds(): Promise<Set<string> | null> {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/deletion-requests?status=pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const result = await res.json();
    return new Set((result.requests ?? []).map((r: { targetId: string }) => String(r.targetId)));
  } catch {
    // Non-critical: worst case the button shows and the API answers 409.
    return null;
  }
}
