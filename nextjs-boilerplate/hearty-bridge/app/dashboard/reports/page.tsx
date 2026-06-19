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

interface Report {
  _id: string;
  title: string;
  description: string;
  content?: string;
  type: "progress" | "assessment" | "therapy-notes" | "milestone";
  status: "draft" | "completed" | "reviewed";
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
    reviewed: "Ditinjau",
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
  if (status === "reviewed") return "secondary";
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
// Read-only view dialog
// ─────────────────────────────────────────────────────────────────────────────
function ReportViewDialog({
  report,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  return (
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
                <p className="text-xs text-gray-500 mb-0.5">Batas Waktu</p>
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
                {report.mediaFiles.map((m) => (
                  <a
                    key={m.gcsPath}
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 block"
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
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, overdue: 0 });
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

  if (!permissions.hasPermission("reports:view")) {
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
        const completed = data.filter((r) => r.status === "completed").length;
        const pending = data.filter((r) => r.status === "draft").length;
        const overdue = data.filter((r) => {
          if (!r.dueDate) return false;
          return new Date(r.dueDate) < new Date() && r.status !== "completed";
        }).length;
        setStats({ total: data.length, completed, pending, overdue });
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
          {/* Header */}
          <div className="p-5 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 mb-2">
                  <Badge className={getTypeColor(report.type)} variant="outline">
                    {getTypeLabel(report.type)}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(report.status)}>
                    {getStatusLabel(report.status)}
                  </Badge>
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
                </div>
                <h3 className="text-base font-semibold text-gray-900 leading-snug">
                  {report.title}
                </h3>
                {report.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {report.description}
                  </p>
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
          </div>

          {/* Body */}
          <div className="px-5 pb-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5 text-gray-700">
                <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>
                  <span className="font-medium">Dibuat:</span>{" "}
                  {new Date(report.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              {report.dueDate && (
                <div className="flex items-center gap-1.5 text-gray-700">
                  <CalendarIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>
                    <span className="font-medium">Batas:</span>{" "}
                    {new Date(report.dueDate).toLocaleDateString("id-ID")}
                  </span>
                </div>
              )}
            </div>

            {report.tags && report.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {report.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-gray-100">
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
        <p className="text-gray-600 mb-4">
          {searchTerm || typeFilter !== "all" || statusFilter !== "all"
            ? "Coba sesuaikan kriteria pencarian."
            : "Mulai dengan membuat laporan pertama."}
        </p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Total Laporan",
            value: stats.total,
            icon: <FileTextIcon className="h-6 w-6 text-teal-600" />,
            bg: "bg-teal-100",
            gradientColor: "#ccfbf1",
          },
          {
            label: "Selesai",
            value: stats.completed,
            icon: <BarChart3Icon className="h-6 w-6 text-green-600" />,
            bg: "bg-green-100",
            gradientColor: "#dcfce7",
          },
          {
            label: "Tertunda",
            value: stats.pending,
            icon: <TrendingUpIcon className="h-6 w-6 text-yellow-600" />,
            bg: "bg-yellow-100",
            gradientColor: "#fef9c3",
          },
          {
            label: "Terlambat",
            value: stats.overdue,
            icon: <CalendarIcon className="h-6 w-6 text-red-600" />,
            bg: "bg-red-100",
            gradientColor: "#fee2e2",
          },
        ].map((s, idx) => (
          <BlurFade key={s.label} delay={idx * 0.08} inView>
            <div className="rounded-xl shadow-sm">
              <MagicCard gradientColor={s.gradientColor} gradientOpacity={0.5}>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className={`p-2 ${s.bg} rounded-lg`}>{s.icon}</div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{s.label}</p>
                      <NumberTicker
                        value={s.value}
                        className="text-2xl font-bold text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </MagicCard>
            </div>
          </BlurFade>
        ))}
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
                  { value: "reviewed", label: "Ditinjau" },
                ]}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="draft">Draf</TabsTrigger>
              <TabsTrigger value="completed">Selesai</TabsTrigger>
              <TabsTrigger value="reviewed">Ditinjau</TabsTrigger>
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
            <TabsContent value="reviewed" className="mt-6">
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
