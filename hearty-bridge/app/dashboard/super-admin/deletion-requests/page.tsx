"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheckIcon,
  XCircleIcon,
  CheckIcon,
  XIcon,
  UserIcon,
  BabyIcon,
  AlertTriangleIcon,
} from "lucide-react";

interface DeletionRequestItem {
  _id: string;
  targetType: "parent" | "child";
  targetId: string;
  targetName: string;
  relatedChildNames: string[];
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedByName: string;
  reviewedByName: string;
  reviewedAt: string | null;
  reviewNote: string;
  createdAt: string;
}

type Tab = "pending" | "history";

const STATUS_LABEL: Record<DeletionRequestItem["status"], { text: string; className: string }> = {
  pending:  { text: "Menunggu", className: "bg-amber-100 text-amber-800" },
  approved: { text: "Disetujui", className: "bg-red-100 text-red-700" },
  rejected: { text: "Ditolak", className: "bg-gray-100 text-gray-600" },
};

async function fetchRequests(tab: Tab): Promise<{ requests: DeletionRequestItem[]; error: string | null }> {
  try {
    const token = localStorage.getItem("token");
    const status = tab === "pending" ? "pending" : "all";
    const res = await fetch(`/api/deletion-requests?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { requests: [], error: result.error || "Gagal memuat permintaan" };
    }
    const list: DeletionRequestItem[] = result.requests ?? [];
    return { requests: tab === "pending" ? list : list.filter((r) => r.status !== "pending"), error: null };
  } catch {
    return { requests: [], error: "Terjadi kesalahan. Coba lagi." };
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function DeletionRequestsPage() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const [tab, setTab] = useState<Tab>("pending");
  // Bumped after approve/reject to refetch the current tab.
  const [reloadCount, setReloadCount] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; requests: DeletionRequestItem[]; error: string | null } | null>(null);
  const loadKey = `${tab}:${reloadCount}`;
  const loading = loaded?.key !== loadKey;
  const requests = loaded?.requests ?? [];
  const error = loaded?.error ?? null;

  const [review, setReview] = useState<{ request: DeletionRequestItem; action: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRequests(tab).then((result) => {
      if (!cancelled) setLoaded({ key: `${tab}:${reloadCount}`, ...result });
    });
    return () => { cancelled = true; };
  }, [tab, reloadCount]);

  const openReview = (request: DeletionRequestItem, action: "approve" | "reject") => {
    setReview({ request, action });
    setNote("");
    setReviewError(null);
  };

  const submitReview = async () => {
    if (!review) return;
    setSubmitting(true);
    setReviewError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/deletion-requests/${review.request._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: review.action, note: note.trim() || undefined }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setReview(null);
        setReloadCount((c) => c + 1);
      } else {
        setReviewError(result.error || "Gagal memproses permintaan");
      }
    } catch {
      setReviewError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!permissions.hasPermission("accounts:approve_deletion")) {
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheckIcon className="h-6 w-6 text-teal-600" />
          Permintaan Hapus Akun
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Setujui atau tolak pengajuan hapus akun orang tua/anak dari Admin. Riwayat sesi dan invoice tetap tersimpan.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {([
          { key: "pending", label: "Menunggu" },
          { key: "history", label: "Riwayat" },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">
              {tab === "pending" ? "Tidak ada permintaan yang menunggu" : "Belum ada riwayat"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const status = STATUS_LABEL[r.status];
            return (
              <Card key={r._id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {r.targetType === "parent" ? (
                          <UserIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <BabyIcon className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-semibold text-gray-900 break-words min-w-0">{r.targetName}</span>
                        <Badge variant="outline">{r.targetType === "parent" ? "Orang tua" : "Anak"}</Badge>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                          {status.text}
                        </span>
                      </div>
                      {r.targetType === "parent" && r.relatedChildNames.length > 0 && (
                        <p className="text-sm text-red-700 break-words">
                          Akun anak ikut terhapus: {r.relatedChildNames.join(", ")}
                        </p>
                      )}
                      {r.reason && <p className="text-sm text-gray-700 break-words">Alasan: {r.reason}</p>}
                      <p className="text-xs text-gray-500 break-words">
                        Diajukan oleh {r.requestedByName} · {formatDateTime(r.createdAt)}
                      </p>
                      {r.status !== "pending" && (
                        <p className="text-xs text-gray-500 break-words">
                          {r.status === "approved" ? "Disetujui" : "Ditolak"} oleh {r.reviewedByName || "-"} ·{" "}
                          {formatDateTime(r.reviewedAt)}
                          {r.reviewNote && <> · Catatan: {r.reviewNote}</>}
                        </p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => openReview(r, "reject")}>
                          <XIcon className="h-4 w-4 mr-1" />
                          Tolak
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => openReview(r, "approve")}
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Setujui &amp; Hapus
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve / Reject Dialog */}
      <Dialog open={!!review} onOpenChange={(open) => { if (!open) setReview(null); }}>
        <DialogContent className="sm:max-w-md">
          {review && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {review.action === "approve" ? "Setujui & hapus akun" : "Tolak permintaan"}
                </DialogTitle>
                <DialogDescription>
                  {review.action === "approve" ? (
                    <>Akun <strong>{review.request.targetName}</strong> akan dihapus sekarang.</>
                  ) : (
                    <>Permintaan hapus akun <strong>{review.request.targetName}</strong> ditolak, akun tetap aktif.</>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {review.action === "approve" && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800 flex gap-2">
                    <AlertTriangleIcon className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-1 min-w-0 break-words">
                      <p>Akun tidak bisa login lagi dan hilang dari daftar pasien aktif. Jadwal ke depan dibatalkan.</p>
                      {review.request.targetType === "parent" && review.request.relatedChildNames.length > 0 && (
                        <p>Akun anak ikut terhapus: <strong>{review.request.relatedChildNames.join(", ")}</strong></p>
                      )}
                      <p>Riwayat sesi, laporan, dan invoice tetap tersimpan.</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Catatan untuk Admin (opsional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                {reviewError && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-600">{reviewError}</div>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setReview(null)} disabled={submitting}>
                  Batal
                </Button>
                <Button
                  className={review.action === "approve" ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                  onClick={submitReview}
                  disabled={submitting}
                >
                  {submitting ? "Memproses..." : review.action === "approve" ? "Hapus Akun" : "Tolak"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
