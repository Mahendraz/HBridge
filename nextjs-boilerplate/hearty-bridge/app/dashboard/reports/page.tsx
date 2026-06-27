"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions, PermissionGuard } from "@/lib/utils/permissions";
import { useReportDraft } from "@/lib/hooks/useReportDraft";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MagicCard } from "@/components/magicui/magic-card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BlurFade } from "@/components/magicui/blur-fade";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileTextIcon,
  SearchIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  TrendingUpIcon,
  BarChart3Icon,
  FileIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  ImageIcon,
  VideoIcon,
  AlertCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  XIcon,
  ZoomInIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  CheckCircle2Icon,
  CornerDownRightIcon,
  SendIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PatientOption {
  _id: string;
  name: string;
  diagnosis?: string;
  dateOfBirth?: string;
  assignedTherapistName?: string;
}

interface ReportMediaFile {
  fileName: string;
  fileType: "image" | "video" | "document";
  gcsPath: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface ReportSeenBy {
  userId: string;
  userName: string;
  role: string;
  seenAt: string;
}

interface ReportReaction {
  emoji: string;
  userId: string;
  userName: string;
}

interface ReportComment {
  _id: string;
  reportId: string;
  authorId: string;
  authorName: string;
  authorRole: 'parent' | 'therapist' | 'admin';
  text: string;
  parentCommentId: string | null;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolvedByName?: string;
  createdAt: string;
  updatedAt: string;
}

interface Report {
  _id: string;
  title: string;
  description: string;
  content?: string;
  type: "progress" | "assessment" | "therapy-notes" | "milestone";
  status: "draft" | "completed";
  childId?: string;
  childName: string;
  therapistId?: string;
  therapistName: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags?: string[];
  fileUrl?: string;
  mediaFiles?: ReportMediaFile[];
  seenBy?: ReportSeenBy[];
  reactions?: ReportReaction[];
  unresolvedCommentCount?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    progress: "Kemajuan",
    assessment: "Penilaian",
    "therapy-notes": "Catatan Terapi",
    milestone: "Tonggak Capaian",
  };
  return map[type] ?? type;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Draf",
    completed: "Selesai",
  };
  return map[status] ?? status;
}

function getTypeColor(type: string) {
  const map: Record<string, string> = {
    progress: "bg-teal-100 text-teal-800",
    assessment: "bg-green-100 text-green-800",
    "therapy-notes": "bg-purple-100 text-purple-800",
    milestone: "bg-orange-100 text-orange-800",
  };
  return map[type] ?? "bg-gray-100 text-gray-800";
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "outline" {
  if (status === "completed") return "default";
  return "outline";
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
// Patient picker dialog
// ─────────────────────────────────────────────────────────────────────────────
function PatientPickerDialog({
  onSelect,
  onClose,
}: {
  onSelect: (patient: PatientOption) => void;
  onClose: () => void;
}) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
    fetch("/api/children", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((result) =>
        setPatients(
          (result.children || []).map((c: any) => ({
            _id: c.id || c._id,
            name: c.name,
            diagnosis: c.medicalInfo?.conditions?.[0] || c.diagnosis || "",
            dateOfBirth: c.dateOfBirth,
            assignedTherapistName: c.therapist?.name || c.assignedTherapistName || "",
          }))
        )
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.diagnosis || "").toLowerCase().includes(search.toLowerCase())
  );

  function getInitials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pilih Pasien</DialogTitle>
        </DialogHeader>

        <div className="mt-3 mb-4 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari nama atau diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Tidak ada pasien ditemukan.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filtered.map((p) => (
              <button
                key={p._id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors text-left group"
              >
                <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {getInitials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.name}</p>
                  {p.diagnosis && (
                    <p className="text-xs text-gray-500 truncate">{p.diagnosis}</p>
                  )}
                  {p.assignedTherapistName && (
                    <p className="text-xs text-gray-400 truncate">
                      Terapis: {p.assignedTherapistName}
                    </p>
                  )}
                </div>
                <ChevronRightIcon className="h-4 w-4 text-gray-300 group-hover:text-teal-500 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox – full-screen image viewer
// ─────────────────────────────────────────────────────────────────────────────
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: ReportMediaFile[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = React.useState(startIndex);
  const current = images[idx];

  // Keyboard navigation
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && idx > 0) setIdx((i) => i - 1);
      if (e.key === "ArrowRight" && idx < images.length - 1) setIdx((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, images.length, onClose]);

  // Lock body scroll while open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!current) return null;

  return (
    // Backdrop — click outside image to close
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Top bar: counter + close */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm tabular-nums select-none">
          {images.length > 1 ? `${idx + 1} / ${images.length}` : ""}
        </span>
        <div className="flex items-center gap-3">
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="text-white/60 hover:text-white transition-colors"
            title="Buka di tab baru"
          >
            <ExternalLinkIcon className="h-5 w-5" />
          </a>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            title="Tutup (Esc)"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Prev arrow */}
      {idx > 0 && (
        <button
          className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-10
                     bg-white/10 hover:bg-white/25 active:bg-white/35
                     text-white rounded-full p-2 sm:p-3 transition-colors"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
          title="Sebelumnya (←)"
        >
          <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Image card */}
      <div
        className="flex flex-col items-center gap-3 max-w-[92vw] max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10
                        flex items-center justify-center
                        bg-black/40 max-w-[92vw] max-h-[80vh]">
          <img
            key={current.gcsPath}
            src={current.url}
            alt={current.fileName}
            className="block max-w-[92vw] max-h-[80vh] w-auto h-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0.3";
            }}
          />
        </div>

        {/* Caption */}
        <div className="flex items-center gap-2 text-center">
          <p className="text-white/70 text-xs sm:text-sm truncate max-w-[80vw]">
            {current.fileName}
          </p>
          {current.size > 0 && (
            <span className="text-white/40 text-xs shrink-0">
              ({(current.size / 1024).toFixed(0)} KB)
            </span>
          )}
        </div>

        {/* Dot strip (shows when multiple images) */}
        {images.length > 1 && (
          <div className="flex gap-1.5 mt-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === idx
                    ? "bg-white w-5"
                    : "bg-white/35 hover:bg-white/60 w-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Next arrow */}
      {idx < images.length - 1 && (
        <button
          className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-10
                     bg-white/10 hover:bg-white/25 active:bg-white/35
                     text-white rounded-full p-2 sm:p-3 transition-colors"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
          title="Berikutnya (→)"
        >
          <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}
    </div>
  );
}

const EMOJIS = ['👍', '❤️', '🎉', '😮', '😢'];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Read-only view dialog
// ─────────────────────────────────────────────────────────────────────────────
function ReportViewDialog({
  report: initialReport,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);
  const [reactions, setReactions] = React.useState<ReportReaction[]>(initialReport.reactions ?? []);
  const [seenBy, setSeenBy] = React.useState<ReportSeenBy[]>(initialReport.seenBy ?? []);
  const [comments, setComments] = React.useState<ReportComment[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(true);
  const [newCommentText, setNewCommentText] = React.useState('');
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [commentError, setCommentError] = React.useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const report = initialReport;

  // Only images go into the lightbox; videos keep their external link
  const imageFiles = (report.mediaFiles ?? []).filter((m) => m.fileType === "image");

  React.useEffect(() => {
    // Mark as seen (fire-and-forget)
    fetch(`/api/reports/${report._id}/seen`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    // Load comments
    setCommentsLoading(true);
    fetch(`/api/reports/${report._id}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setComments(d?.comments ?? []))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [report._id, token]);

  const handleReaction = async (emoji: string) => {
    const res = await fetch(`/api/reports/${report._id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ emoji }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) setReactions(data?.reactions ?? reactions);
  };

  const handleSubmitComment = async (parentCommentId?: string) => {
    const text = parentCommentId ? replyText : newCommentText;
    if (!text.trim()) return;
    setSubmitting(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/reports/${report._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: text.trim(), parentCommentId: parentCommentId ?? null }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal mengirim komentar');
      if (data?.comment) setComments((prev) => [...prev, data.comment]);
      if (parentCommentId) { setReplyingTo(null); setReplyText(''); }
      else setNewCommentText('');
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async (commentId: string, isResolved: boolean) => {
    const res = await fetch(`/api/reports/${report._id}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isResolved: !isResolved }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.comment) {
      setComments((prev) => prev.map((c) => c._id === commentId ? { ...c, ...data.comment } : c));
    }
  };

  const canResolve = user?.role === 'admin' || user?.role === 'super_admin' || (user?.role === 'therapist' && report.therapistId === user?._id);

  // Group: root comments + their replies
  const rootComments = comments.filter((c) => !c.parentCommentId);
  const repliesFor = (id: string) => comments.filter((c) => c.parentCommentId === id);

  return (
    <>
      {/* Lightbox rendered outside Dialog so it covers the entire viewport */}
      {lightboxIdx !== null && (
        <Lightbox
          images={imageFiles}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent size="full">
          <DialogHeader>
            <DialogTitle>Detail Laporan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <Badge className={getTypeColor(report.type)} variant="outline">
                {getTypeLabel(report.type)}
              </Badge>
              <Badge variant={getStatusBadgeVariant(report.status)}>
                {getStatusLabel(report.status)}
              </Badge>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-0.5">Judul</p>
              <p className="text-lg font-semibold text-gray-900">{report.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Pasien</p>
                <p className="text-gray-900">{report.childName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Terapis</p>
                <p className="text-gray-900">{report.therapistName || "—"}</p>
              </div>
            </div>

            {report.description && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Deskripsi</p>
                <p className="text-sm text-gray-700">{report.description}</p>
              </div>
            )}

            {report.content && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Isi Laporan</p>
                <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded p-3 min-h-[60px]">
                  {report.content}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Tanggal Dibuat</p>
                <p className="text-gray-900">
                  {new Date(report.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              {report.dueDate && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Waktu Terapi</p>
                  <p className="text-gray-900">
                    {new Date(report.dueDate).toLocaleDateString("id-ID")}
                  </p>
                </div>
              )}
            </div>

            {report.tags && report.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Tag</p>
                <div className="flex flex-wrap gap-1">
                  {report.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {report.mediaFiles && report.mediaFiles.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Media ({report.mediaFiles.length} file)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {report.mediaFiles.map((m) => {
                    const imgIdx = imageFiles.findIndex((img) => img.gcsPath === m.gcsPath);
                    const isImage = m.fileType === "image";
                    return (
                      <div key={m.gcsPath} className="group relative">
                        {isImage ? (
                          // Clickable image thumbnail → opens lightbox
                          <button
                            type="button"
                            onClick={() => setLightboxIdx(imgIdx)}
                            className="w-full text-left border rounded-lg overflow-hidden bg-gray-50
                                       hover:border-teal-400 focus-visible:outline-none
                                       focus-visible:ring-2 focus-visible:ring-teal-500
                                       transition-all block"
                          >
                            <div className="relative overflow-hidden">
                              <img
                                src={m.url}
                                alt={m.fileName}
                                className="w-full h-24 object-cover transition-transform duration-300
                                           group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                              {/* Zoom hint overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20
                                              flex items-center justify-center
                                              opacity-0 group-hover:opacity-100
                                              transition-all duration-200">
                                <ZoomInIcon className="h-7 w-7 text-white drop-shadow-lg" />
                              </div>
                            </div>
                            <div className="px-2 py-1.5">
                              <p className="text-[10px] text-gray-600 truncate">{m.fileName}</p>
                            </div>
                          </button>
                        ) : (
                          // Video → open in new tab
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noreferrer"
                            className="border rounded-lg overflow-hidden bg-gray-50
                                       hover:bg-gray-100 hover:border-gray-300 block transition-colors"
                          >
                            <div className="flex items-center justify-center h-24 bg-gray-100">
                              <VideoIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="px-2 py-1.5">
                              <p className="text-[10px] text-gray-600 truncate">{m.fileName}</p>
                            </div>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Reactions ── */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Reaksi</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((emoji) => {
                  const count = reactions.filter((r) => r.emoji === emoji).length;
                  const mine = reactions.some((r) => r.emoji === emoji && r.userId === user?._id);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-colors ${
                        mine
                          ? 'bg-teal-50 border-teal-400 text-teal-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {emoji}
                      {count > 0 && <span className="text-xs font-medium">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Seen by ── */}
            {seenBy.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Dilihat oleh:{' '}
                  {seenBy.map((s, i) => (
                    <span key={s.userId}>
                      {i > 0 && ' • '}
                      <span className="font-medium text-gray-600">{s.userName}</span>
                      <span className="text-gray-400"> ({s.role})</span>
                    </span>
                  ))}
                </p>
              </div>
            )}

            {/* ── Comments ── */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <MessageCircleIcon className="h-3.5 w-3.5 text-teal-600" />
                Komentar {comments.length > 0 && `(${comments.length})`}
              </p>

              {commentsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600" />
                </div>
              ) : rootComments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Belum ada komentar. Jadilah yang pertama!</p>
              ) : (
                <div className="space-y-3">
                  {rootComments.map((comment) => {
                    const replies = repliesFor(comment._id);
                    return (
                      <div
                        key={comment._id}
                        className={`rounded-xl border p-3 transition-colors ${
                          comment.isResolved ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200 bg-white'
                        }`}
                      >
                        {/* Comment header */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {comment.authorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-gray-800">{comment.authorName}</span>
                            <span className="text-[10px] text-gray-400 capitalize">{comment.authorRole}</span>
                            <span className="text-[10px] text-gray-400">{relativeTime(comment.createdAt)}</span>
                          </div>
                          {comment.isResolved && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2Icon className="h-3 w-3" /> Selesai
                            </span>
                          )}
                        </div>

                        {/* Text */}
                        <p className="text-sm text-gray-700 whitespace-pre-wrap ml-8">{comment.text}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2 ml-8">
                          <button
                            onClick={() => { setReplyingTo(comment._id); setReplyText(''); }}
                            className="text-[11px] text-teal-600 hover:text-teal-800 font-medium flex items-center gap-0.5"
                          >
                            <CornerDownRightIcon className="h-3 w-3" /> Balas
                          </button>
                          {canResolve && (
                            <button
                              onClick={() => handleToggleResolve(comment._id, comment.isResolved)}
                              className={`text-[11px] font-medium flex items-center gap-0.5 ${
                                comment.isResolved
                                  ? 'text-gray-500 hover:text-gray-700'
                                  : 'text-amber-600 hover:text-amber-800'
                              }`}
                            >
                              <CheckCircle2Icon className="h-3 w-3" />
                              {comment.isResolved ? 'Buka Kembali' : 'Tandai Selesai'}
                            </button>
                          )}
                        </div>

                        {/* Inline reply box */}
                        {replyingTo === comment._id && (
                          <div className="mt-2 ml-8 flex gap-2">
                            <input
                              autoFocus
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(comment._id); } }}
                              placeholder="Tulis balasan..."
                              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <button
                              onClick={() => handleSubmitComment(comment._id)}
                              disabled={!replyText.trim() || submitting}
                              className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded-lg hover:bg-teal-700 disabled:opacity-40"
                            >
                              <SendIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setReplyingTo(null)}
                              className="px-2 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="mt-2 ml-8 space-y-2">
                            {replies.map((reply) => (
                              <div key={reply._id} className="flex gap-2">
                                <CornerDownRightIcon className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-xs font-semibold text-gray-700">{reply.authorName}</span>
                                    <span className="text-[10px] text-gray-400 capitalize">{reply.authorRole}</span>
                                    <span className="text-[10px] text-gray-400">{relativeTime(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New comment box */}
              {commentError && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{commentError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                  placeholder="Tulis komentar... (Enter untuk kirim)"
                  rows={2}
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <button
                  onClick={() => handleSubmitComment()}
                  disabled={!newCommentText.trim() || submitting}
                  className="self-end px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <SendIcon className="h-3.5 w-3.5" />
                  Kirim
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const permissions = usePermissions(user?.role || "parent");
  const draftHook = useReportDraft();

  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const handlePatientSelect = (patient: PatientOption) => {
    setShowPatientPicker(false);
    const params = new URLSearchParams({
      childId: patient._id,
      childName: patient.name,
      ...(patient.diagnosis ? { diagnosis: patient.diagnosis } : {}),
      ...(patient.assignedTherapistName ? { therapistName: patient.assignedTherapistName } : {}),
    });
    router.push(`/dashboard/reports/new?${params.toString()}`);
  };

  if (!permissions.hasAnyPermission(["reports:view", "reports:view_own"])) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-500 text-lg">Akses Ditolak</div>
        <div className="text-gray-600 text-sm">
          Anda tidak memiliki izin untuk melihat konten ini
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, searchTerm, typeFilter, statusFilter, activeTab]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch("/api/reports", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const result = await res.json();
        const data: Report[] = result.success && result.data ? result.data : [];
        setReports(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setFetchError(err.error || `Gagal memuat data (${res.status})`);
        setReports([]);
      }
    } catch {
      setFetchError("Tidak dapat terhubung ke server.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];
    if (activeTab !== "all") filtered = filtered.filter((r) => r.status === activeTab);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.childName.toLowerCase().includes(q) ||
          r.therapistName.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") filtered = filtered.filter((r) => r.type === typeFilter);
    if (statusFilter !== "all") filtered = filtered.filter((r) => r.status === statusFilter);
    setFilteredReports(filtered);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Yakin ingin menghapus laporan ini?")) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchReports();
    } catch {
      // ignore
    }
  };

  // ── ReportCard ──────────────────────────────────────────────────────────────
  const ReportCard = ({ report }: { report: Report }) => {
    const hasMedia = report.mediaFiles && report.mediaFiles.length > 0;
    const firstMedia = report.mediaFiles?.[0];
    const downloadUrl = firstMedia?.url ?? report.fileUrl;

    return (
      <div className="rounded-xl shadow-sm hover:shadow-lg transition-shadow">
        <MagicCard gradientColor="#f0fdfa" gradientOpacity={0.5}>
          <div className="p-5 space-y-3">
            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {hasMedia && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {report.mediaFiles!.some((m) => m.fileType === "video") ? (
                      <VideoIcon className="h-3 w-3 mr-1 inline" />
                    ) : (
                      <ImageIcon className="h-3 w-3 mr-1 inline" />
                    )}
                    {report.mediaFiles!.length} media
                  </Badge>
                )}
                {(report.unresolvedCommentCount ?? 0) > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                  >
                    <MessageCircleIcon className="h-3 w-3 mr-1 inline" />
                    {report.unresolvedCommentCount} komentar
                  </Badge>
                )}
              </div>
              <PermissionGuard
                userRole={user?.role || "parent"}
                permissions={["reports:create", "reports:view_all"]}
              >
                <div className="flex shrink-0 space-x-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingReport(report)}
                    title="Lihat detail"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/reports/${report._id}/edit`)}
                    title="Edit"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(report._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Hapus"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </PermissionGuard>
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-gray-700">
                <UserIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">
                  <span className="font-medium">Pasien:</span> {report.childName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700">
                <UserIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="truncate">
                  <span className="font-medium">Terapis:</span> {report.therapistName}
                </span>
              </div>
              {report.dueDate && (
                <div className="flex items-center gap-1.5 text-gray-700">
                  <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>
                    <span className="font-medium">Waktu Terapi:</span>{" "}
                    {new Date(report.dueDate).toLocaleDateString("id-ID")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setViewingReport(report)}
              >
                <EyeIcon className="h-4 w-4 mr-1.5" />
                Lihat
              </Button>
              {downloadUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(downloadUrl, "_blank")}
                >
                  <DownloadIcon className="h-4 w-4 mr-1.5" />
                  Unduh
                </Button>
              )}
            </div>
          </div>
        </MagicCard>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-500">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileTextIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">Gagal memuat data</p>
          <p className="text-sm text-red-600 mb-4">{fetchError}</p>
          <Button variant="outline" onClick={fetchReports}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // ── Local draft card (shows in list when localStorage has a pending draft) ──
  const LocalDraftCard = () => {
    const d = draftHook.draft;
    if (!d || d.editingId) return null; // only show create-drafts (not edit-drafts)

    const typeMap: Record<string, string> = {
      progress: "Kemajuan",
      assessment: "Penilaian",
      "therapy-notes": "Catatan Terapi",
      milestone: "Tonggak Capaian",
    };

    return (
      <Card className="relative overflow-hidden border-2 border-dashed border-yellow-400 bg-yellow-50 hover:shadow-md transition-shadow">
        <BorderBeam colorFrom="#eab308" colorTo="#f97316" duration={4} size={80} borderWidth={2} />
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800">
                  <AlertCircleIcon className="h-3 w-3" />
                  DRAF LOKAL
                </span>
                {d.type && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {typeMap[d.type] || d.type}
                  </span>
                )}
              </div>
              <CardTitle className="text-base text-gray-800">
                {d.title ? d.title : <span className="italic text-gray-400">Laporan belum diberi judul</span>}
              </CardTitle>
              {d.childName && (
                <p className="text-sm text-gray-600 mt-1">Pasien: {d.childName}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <ClockIcon className="h-3 w-3" />
            <span>Tersimpan {formatSavedAt(d.savedAt)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => router.push("/dashboard/reports/new")}
            >
              Lanjutkan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => draftHook.clear()}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              Hapus
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ReportGrid = () => {
    const showDraft = draftHook.hasDraft && draftHook.draft && !draftHook.draft.editingId &&
      (activeTab === "all" || activeTab === "draft");

    return filteredReports.length === 0 && !showDraft ? (
      <div className="text-center py-12">
        <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tidak ada laporan ditemukan
        </h3>
        <p className="text-gray-600">
          {searchTerm || typeFilter !== "all" || statusFilter !== "all"
            ? "Coba sesuaikan kriteria pencarian."
            : "Mulai dengan membuat laporan pertama."}
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {showDraft && (
          <BlurFade delay={0} inView>
            <LocalDraftCard />
          </BlurFade>
        )}
        {filteredReports.map((r, idx) => (
          <BlurFade key={r._id} delay={idx * 0.06} inView>
            <ReportCard report={r} />
          </BlurFade>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan &amp; Analitik</h1>
          <p className="text-gray-600">Pantau kemajuan dan buat laporan komprehensif</p>
        </div>
        <PermissionGuard
          userRole={user?.role || "parent"}
          permissions={["reports:create"]}
        >
          <ShimmerButton
            borderRadius="8px"
            onClick={() => setShowPatientPicker(true)}
            className="text-sm font-medium px-4 py-2"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Buat Laporan
          </ShimmerButton>
        </PermissionGuard>
      </div>

      {/* Filter + List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Cari laporan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
                options={[
                  { value: "all", label: "Semua Jenis" },
                  { value: "progress", label: "Kemajuan" },
                  { value: "assessment", label: "Penilaian" },
                  { value: "therapy-notes", label: "Catatan Terapi" },
                  { value: "milestone", label: "Tonggak Capaian" },
                ]}
              />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={[
                  { value: "all", label: "Semua Status" },
                  { value: "draft", label: "Draf" },
                  { value: "completed", label: "Selesai" },
                ]}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="draft">Draf</TabsTrigger>
              <TabsTrigger value="completed">Selesai</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              <ReportGrid />
            </TabsContent>
            <TabsContent value="draft" className="mt-6">
              <ReportGrid />
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
              <ReportGrid />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Patient picker dialog */}
      {showPatientPicker && (
        <PatientPickerDialog
          onSelect={handlePatientSelect}
          onClose={() => setShowPatientPicker(false)}
        />
      )}

      {/* Read-only view dialog */}
      {viewingReport && (
        <ReportViewDialog
          report={viewingReport}
          onClose={() => setViewingReport(null)}
        />
      )}
    </div>
  );
}
