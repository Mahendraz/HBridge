"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BorderBeam } from "@/components/magicui/border-beam";
import {
  MegaphoneIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  PaperclipIcon,
  FileTextIcon,
  XIcon,
} from "lucide-react";

interface AnnouncementAttachment {
  fileName: string;
  fileType: "image" | "document";
  url: string;
  mimeType: string;
}

interface AnnouncementData {
  _id: string;
  title: string;
  content: string;
  attachments: AnnouncementAttachment[];
  authorName: string;
  createdAt: string;
}

const EMPTY_FORM = { title: "", content: "" };
const PREVIEW_COUNT = 5;

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnnouncementWall() {
  const { user } = useAuth();
  const permissions = usePermissions(user?.role ?? "parent");
  const canManage = permissions.hasPermission("announcements:manage");

  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [file, setFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setAnnouncements(result.announcements ?? []);
      }
    } catch {
      // silent fail — wall is non-critical to the rest of the dashboard
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) fetchAnnouncements();
  }, [user, fetchAnnouncements]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFile(null);
    setRemoveAttachment(false);
    setSaveError(null);
    setShowDialog(true);
  };

  const openEdit = (a: AnnouncementData) => {
    setEditingId(a._id);
    setForm({ title: a.title, content: a.content });
    setFile(null);
    setRemoveAttachment(false);
    setSaveError(null);
    setShowDialog(true);
  };

  const editingAnnouncement = editingId ? announcements.find((a) => a._id === editingId) : null;

  const handleSave = async () => {
    if (!form.title.trim()) { setSaveError("Judul wajib diisi"); return; }
    if (!form.content.trim()) { setSaveError("Isi pengumuman wajib diisi"); return; }

    setSaving(true);
    setSaveError(null);
    try {
      const body = new FormData();
      body.append("title", form.title.trim());
      body.append("content", form.content.trim());
      if (file) body.append("file", file);
      if (removeAttachment) body.append("removeAttachment", "true");

      const url = editingId ? `/api/announcements/${editingId}` : "/api/announcements";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setShowDialog(false);
        fetchAnnouncements();
      } else {
        setSaveError(result.error || "Gagal menyimpan pengumuman");
      }
    } catch {
      setSaveError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: AnnouncementData) => {
    if (!confirm(`Hapus pengumuman "${a.title}"?`)) return;
    try {
      const res = await fetch(`/api/announcements/${a._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchAnnouncements();
    } catch {
      // silent fail — user can retry
    }
  };

  // Nothing to view and nothing to manage — don't take up space on the dashboard
  if (!loading && announcements.length === 0 && !canManage) return null;

  const visible = showAll ? announcements : announcements.slice(0, PREVIEW_COUNT);

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <BorderBeam size={140} duration={7} colorFrom="#f59e0b" colorTo="#f43f5e" />
      <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <MegaphoneIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Pengumuman</h2>
            <p className="text-xs text-gray-500 mt-0.5">{announcements.length} pengumuman aktif</p>
          </div>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Buat Pengumuman
          </Button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8">
            <MegaphoneIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Belum ada pengumuman</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((a) => (
              <div key={a._id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                    {a.attachments?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {a.attachments.map((att, i) =>
                          att.fileType === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element -- signed R2 URL, not a static/optimizable asset
                            <img
                              key={i}
                              src={att.url}
                              alt={att.fileName}
                              className="max-h-64 rounded-lg border border-gray-200 object-cover"
                            />
                          ) : (
                            <a
                              key={i}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-2.5 py-1.5"
                            >
                              <FileTextIcon className="h-3.5 w-3.5" />
                              {att.fileName}
                            </a>
                          )
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {a.authorName} &middot; {formatDate(a.createdAt)}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openEdit(a)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(a)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {announcements.length > PREVIEW_COUNT && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full text-sm text-teal-700 hover:text-teal-900 font-medium py-2 text-center"
              >
                {showAll ? "Sembunyikan" : `Lihat semua (${announcements.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog — canManage-gated at the button level above, but
          the underlying API is the real gate (POST/PUT require announcements:manage
          server-side regardless of whether this dialog is ever opened). */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {saveError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {saveError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Judul *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Libur Hari Raya"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Isi Pengumuman *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Tulis isi pengumuman di sini..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lampiran (opsional)</label>
              {editingAnnouncement?.attachments?.length && !file && !removeAttachment ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600 truncate">
                    <PaperclipIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    {editingAnnouncement.attachments[0].fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRemoveAttachment(true)}
                    className="text-red-500 hover:text-red-600 flex-shrink-0"
                    title="Hapus lampiran"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Terbitkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
