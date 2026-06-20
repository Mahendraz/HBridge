"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlusIcon,
  UserIcon,
  StethoscopeIcon,
  ClockIcon,
  XIcon,
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function dateUTCStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getCurrentMondayStr(): string {
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun
  const toMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setUTCDate(now.getUTCDate() + toMon);
  mon.setUTCHours(0, 0, 0, 0);
  return dateUTCStr(mon);
}

function addWeeks(mondayStr: string, n: number): string {
  const [y, m, d] = mondayStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n * 7);
  return dateUTCStr(dt);
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dateUTCStr(dt);
}

function getWeekDates(mondayStr: string): string[] {
  return Array.from({ length: 6 }, (_, i) => addDays(mondayStr, i));
}

function dayNameToOffset(day: string): number {
  return ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"].indexOf(day);
}

function slotSessionDate(weekStart: string, day: string): string {
  const offset = dayNameToOffset(day);
  return offset >= 0 ? addDays(weekStart, offset) : weekStart;
}

function getTodayStr(): string {
  return dateUTCStr(new Date());
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${d}/${m}`;
}

const ID_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function formatWeekRange(mondayStr: string): string {
  const dates = getWeekDates(mondayStr);
  const [y1, m1, d1] = dates[0].split("-").map(Number);
  const [, m2, d2] = dates[5].split("-").map(Number);
  if (m1 === m2) {
    return `${d1}–${d2} ${ID_MONTHS[m1 - 1]} ${y1}`;
  }
  return `${d1} ${ID_MONTHS[m1 - 1]} – ${d2} ${ID_MONTHS[m2 - 1]} ${y1}`;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu"] as const;
type Day = (typeof DAYS)[number];

const DAY_LABELS: Record<Day, string> = {
  senin: "Senin",
  selasa: "Selasa",
  rabu: "Rabu",
  kamis: "Kamis",
  jumat: "Jumat",
  sabtu: "Sabtu",
};

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeeklySlot {
  _id: string;
  day: string;
  hour: number;
  patientId: string;
  patientName: string;
  therapistId: string;
  therapistName: string;
  therapyType: 'OT' | 'TW' | string;
  diagnosis: string;
  notes: string;
  effectiveFrom?: string | null;
}

interface PatientOption {
  _id: string;
  name: string;
  diagnosis: string;
  assignedTherapistId?: string;
  assignedTherapistName?: string;
}

interface TherapistOption {
  _id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// SlotCard — compact card rendered inside each grid cell
// ---------------------------------------------------------------------------

function SlotCard({
  slot,
  isOwn,
  isParentView,
  weekStart,
  reportMap,
  onClick,
  onOpenReportModal,
}: {
  slot: WeeklySlot;
  isOwn: boolean;
  isParentView: boolean;
  weekStart: string;
  reportMap: Record<string, string>;
  onClick: () => void;
  onOpenReportModal: (slot: WeeklySlot, sessionDate: string) => void;
}) {
  const highlight = isOwn || isParentView;
  const sessionDate = slotSessionDate(weekStart, slot.day);
  const hasReport = !!reportMap[`${slot.patientId}_${sessionDate}`];

  return (
    <div
      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm hover:-translate-y-px ${
        highlight
          ? "bg-teal-50 border-teal-200 hover:bg-teal-100"
          : "bg-blue-50 border-blue-100 hover:bg-blue-100"
      }`}
      onClick={onClick}
    >
      <p className="font-semibold text-gray-900 truncate leading-snug">
        {slot.patientName}
      </p>
      <p
        className={`truncate text-[11px] leading-snug mt-0.5 ${
          highlight ? "text-teal-700" : "text-blue-700"
        }`}
      >
        {slot.therapistName.replace(/,.*/, "")}
      </p>
      <p className="text-gray-500 truncate text-[11px] leading-snug">
        {slot.therapyType}
      </p>
      {slot.diagnosis && (
        <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] leading-none">
          {slot.diagnosis}
        </span>
      )}

      {/* Report status (therapist own slots only) */}
      {isOwn && (
        <button
          className="mt-1.5 w-full text-left text-[10px] font-medium leading-snug"
          onClick={(e) => {
            e.stopPropagation();
            onOpenReportModal(slot, sessionDate);
          }}
        >
          {hasReport ? (
            <span className="text-green-600">✅ Laporan ada</span>
          ) : (
            <span className="text-amber-600">⚠️ Isi laporan</span>
          )}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SlotModal — add / edit dialog (admin only)
// ---------------------------------------------------------------------------

interface SlotModalProps {
  slot: Partial<WeeklySlot>;
  patients: PatientOption[];
  therapists: TherapistOption[];
  weekStart: string;
  onClose: () => void;
  onSave: (data: Partial<WeeklySlot> & { effectiveFrom: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

function SlotModal({
  slot,
  patients,
  therapists,
  weekStart,
  onClose,
  onSave,
  onDelete,
}: SlotModalProps) {
  const [form, setForm] = useState<Partial<WeeklySlot>>({
    _id: slot._id || "",
    day: slot.day || "senin",
    hour: slot.hour ?? 9,
    patientId: slot.patientId || "",
    patientName: slot.patientName || "",
    therapistId: slot.therapistId || "",
    therapistName: slot.therapistName || "",
    therapyType: slot.therapyType || "",
    diagnosis: slot.diagnosis || "",
    notes: slot.notes || "",
  });
  const [effectiveChoice, setEffectiveChoice] = useState<"this" | "next">("this");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const thisWeek = weekStart;
  const nextWeek = addWeeks(weekStart, 1);

  const handlePatientChange = (patientId: string) => {
    const p = patients.find((x) => x._id === patientId);
    setForm((f) => ({
      ...f,
      patientId,
      patientName: p?.name || "",
      diagnosis: p?.diagnosis || "",
      therapistId: p?.assignedTherapistId || f.therapistId || "",
      therapistName: p?.assignedTherapistName || f.therapistName || "",
    }));
  };

  const handleTherapistChange = (therapistId: string) => {
    const t = therapists.find((x) => x._id === therapistId);
    setForm((f) => ({ ...f, therapistId, therapistName: t?.name || "" }));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const effectiveFrom = effectiveChoice === "this" ? thisWeek : nextWeek;
      await onSave({ ...form, effectiveFrom });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  const isValid = Boolean(form.patientId && form.therapistId && form.day && form.therapyType?.trim());

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {slot._id ? "Edit Slot Jadwal" : "Tambah Slot Jadwal"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {saveError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* Day + Hour */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Hari</label>
              <select
                value={form.day}
                onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{DAY_LABELS[d]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Jam</label>
              <select
                value={form.hour}
                onChange={(e) => setForm((f) => ({ ...f, hour: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00 – {String(h + 1).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Patient */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              <UserIcon className="inline h-3 w-3 mr-1" />
              Pasien
            </label>
            <select
              value={form.patientId}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Pilih pasien...</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.diagnosis}
                </option>
              ))}
            </select>
          </div>

          {/* Therapist */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              <StethoscopeIcon className="inline h-3 w-3 mr-1" />
              Terapis
            </label>
            <select
              value={form.therapistId}
              onChange={(e) => handleTherapistChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Pilih terapis...</option>
              {therapists.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Therapy type */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Jenis Terapi <span className="text-red-500">*</span>
            </label>
            <select
              value={form.therapyType || ""}
              onChange={(e) => setForm((f) => ({ ...f, therapyType: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Pilih jenis terapi...</option>
              <option value="OT">OT (Terapi Okupasi)</option>
              <option value="TW">TW (Terapi Wicara)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Catatan (opsional)
            </label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* effectiveFrom choice */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600">Perubahan berlaku mulai:</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="effectiveFrom"
                  checked={effectiveChoice === "this"}
                  onChange={() => setEffectiveChoice("this")}
                  className="accent-teal-600"
                />
                <span>
                  Minggu ini
                  <span className="text-gray-400 text-xs ml-1">
                    ({formatShortDate(thisWeek)})
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="effectiveFrom"
                  checked={effectiveChoice === "next"}
                  onChange={() => setEffectiveChoice("next")}
                  className="accent-teal-600"
                />
                <span>
                  Minggu depan
                  <span className="text-gray-400 text-xs ml-1">
                    ({formatShortDate(nextWeek)})
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
          {slot._id && onDelete ? (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus Slot"}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={!isValid || saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function SchedulesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [weekStart, setWeekStart] = useState(getCurrentMondayStr);
  const [slots, setSlots] = useState<WeeklySlot[]>([]);
  const [reportMap, setReportMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<WeeklySlot> | null>(null);
  const [allPatients, setAllPatients] = useState<PatientOption[]>([]);
  const [allTherapists, setAllTherapists] = useState<TherapistOption[]>([]);

  const weekDates = getWeekDates(weekStart);
  const todayStr = getTodayStr();

  // ---- Fetch schedule slots + report map ----

  const fetchSlots = useCallback(async () => {
    if (!user) return;
    try {
      setFetchError(null);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const weekEnd = addDays(weekStart, 5); // Saturday

      const [schedRes, reportRes] = await Promise.all([
        fetch(`/api/weekly-schedule?weekStart=${weekStart}`, { headers }),
        user.role === "therapist"
          ? fetch(`/api/reports?sessionDateFrom=${weekStart}&sessionDateTo=${weekEnd}&limit=200`, { headers })
          : Promise.resolve(null),
      ]);

      if (schedRes.ok) {
        const result = await schedRes.json();
        setSlots(result.data || []);
      } else {
        const err = await schedRes.json().catch(() => ({}));
        setFetchError(err.error || `Gagal memuat jadwal (${schedRes.status})`);
        setSlots([]);
      }

      if (reportRes && reportRes.ok) {
        const rResult = await reportRes.json();
        const reports: any[] = rResult.data || [];
        const map: Record<string, string> = {};
        for (const r of reports) {
          if (r.sessionDate && r.childId) {
            const sd = r.sessionDate.split("T")[0];
            map[`${r.childId}_${sd}`] = r._id;
          }
        }
        setReportMap(map);
      }
    } catch {
      setFetchError("Tidak dapat terhubung ke database.");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [user, weekStart]);

  // ---- Fetch patients + therapists for modal dropdowns (admin only) ----

  const fetchDropdownData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const [pRes, tRes] = await Promise.all([
        fetch("/api/children?limit=100", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/therapists",          { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pRes.ok) {
        const pr = await pRes.json();
        const rawChildren: any[] = pr.children || [];
        setAllPatients(
          rawChildren.map((c) => ({
            _id: c.id,
            name: c.name,
            diagnosis: c.medicalInfo?.conditions?.join(", ") || "",
            assignedTherapistId: c.therapist?.id || "",
            assignedTherapistName: c.therapist?.name || "",
          }))
        );
      }
      if (tRes.ok) {
        const tr = await tRes.json();
        const rawTherapists: any[] = tr.therapists || [];
        setAllTherapists(rawTherapists.map((t) => ({ _id: t._id?.toString() ?? "", name: t.name })));
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSlots();
      if (user.role === "admin") fetchDropdownData();
    }
  }, [user, weekStart, fetchSlots, fetchDropdownData]);

  // ---- Mutations ----

  const handleSave = async (formData: Partial<WeeklySlot> & { effectiveFrom: string }) => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/weekly-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal menyimpan slot (${res.status})`);
    }
    await fetchSlots();
    closeModal();
  };

  const handleDelete = async () => {
    if (!editingSlot?._id) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/weekly-schedule?id=${editingSlot._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSlots();
      closeModal();
    } catch (err) {
      console.error("Error deleting slot:", err);
    }
  };

  // ---- Modal helpers ----

  const openNewSlot = (day?: string, hour?: number) => {
    setEditingSlot({ day: day || "senin", hour: hour ?? 9 });
    setShowModal(true);
  };

  const openEditSlot = (slot: WeeklySlot) => {
    setEditingSlot(slot);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSlot(null);
  };

  // ---- Grid helpers ----

  const getSlotsForCell = (day: string, hour: number) =>
    slots.filter((s) => s.day === day && s.hour === hour);

  // ---- Loading state ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-500">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-900 mb-1">Gagal memuat data</p>
          <p className="text-sm text-red-600 mb-4">{fetchError}</p>
          <Button variant="outline" onClick={fetchSlots}>Coba Lagi</Button>
        </div>
      </div>
    );
  }

  // ---- Render ----

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Mingguan</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            {user?.role === "admin" && "Template jadwal terapi — berlaku setiap minggu"}
            {user?.role === "therapist" && "Jadwal sesi terapi Anda setiap minggu"}
            {user?.role === "parent" && "Jadwal sesi terapi anak Anda"}
          </p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => openNewSlot()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Tambah Slot
          </Button>
        )}
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
        <button
          onClick={() => setWeekStart((ws) => addWeeks(ws, -1))}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Minggu sebelumnya"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="flex-1 text-center text-sm font-medium text-gray-700">
          {formatWeekRange(weekStart)}
        </span>
        <button
          onClick={() => setWeekStart((ws) => addWeeks(ws, 1))}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title="Minggu berikutnya"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
        {weekStart !== getCurrentMondayStr() && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekStart(getCurrentMondayStr())}
            className="ml-2 text-xs h-7 px-3"
          >
            Minggu Ini
          </Button>
        )}
      </div>

      {/* Therapist legend */}
      {user?.role === "therapist" && (
        <div className="flex items-center gap-4 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
          <span className="font-medium text-gray-700">Keterangan:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-50 border border-teal-200 inline-block" />
            Jadwal Anda
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-50 border border-blue-100 inline-block" />
            Terapis lain
          </span>
          <span className="flex items-center gap-1.5 ml-2">
            <span className="text-green-600">✅</span> Laporan ada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-600">⚠️</span> Perlu isi laporan
          </span>
        </div>
      )}

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse min-w-[720px]">
            <thead>
              <tr>
                {/* Time column header */}
                <th className="w-24 p-3 text-xs font-semibold text-gray-500 text-left border-b border-r border-gray-200 bg-gray-50 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    Waktu
                  </div>
                </th>
                {/* Day columns */}
                {DAYS.map((day, i) => {
                  const dateStr = weekDates[i];
                  const isToday = dateStr === todayStr;
                  return (
                    <th
                      key={day}
                      className={`p-3 text-xs font-semibold text-center border-b border-r border-gray-200 min-w-[130px] ${
                        isToday
                          ? "bg-teal-50 text-teal-700"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="font-semibold">{DAY_LABELS[day]}</div>
                      <div
                        className={`text-[11px] font-normal mt-0.5 ${
                          isToday ? "text-teal-500" : "text-gray-400"
                        }`}
                      >
                        {formatShortDate(dateStr)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr
                  key={hour}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Time label */}
                  <td className="p-3 text-xs font-medium text-gray-500 border-r border-gray-200 align-top whitespace-nowrap bg-gray-50/50">
                    <span className="text-gray-700">{String(hour).padStart(2, "0")}:00</span>
                    <br />
                    <span className="text-gray-400 text-[10px]">
                      {String(hour + 1).padStart(2, "0")}:00
                    </span>
                  </td>

                  {/* Day cells */}
                  {DAYS.map((day, i) => {
                    const cellSlots = getSlotsForCell(day, hour);
                    const dateStr = weekDates[i];
                    const isToday = dateStr === todayStr;
                    return (
                      <td
                        key={day}
                        className={`p-1.5 border-r border-gray-100 align-top ${
                          isToday ? "bg-teal-50/30" : ""
                        }`}
                      >
                        <div className="space-y-1 min-h-[64px]">
                          {cellSlots.map((slot) => (
                            <SlotCard
                              key={slot._id}
                              slot={slot}
                              isOwn={
                                user?.role === "therapist" &&
                                slot.therapistId === user?._id
                              }
                              isParentView={user?.role === "parent"}
                              weekStart={weekStart}
                              reportMap={reportMap}
                              onClick={() => {
                                if (user?.role === "admin") openEditSlot(slot);
                              }}
                              onOpenReportModal={(s, sd) => {
                                const existingReportId = reportMap[`${s.patientId}_${sd}`];
                                if (existingReportId) {
                                  router.push(`/dashboard/reports/${existingReportId}/edit`);
                                } else {
                                  const params = new URLSearchParams({
                                    childId: s.patientId,
                                    childName: s.patientName,
                                    sessionDate: sd,
                                    sessionHour: String(s.hour),
                                    therapyType: s.therapyType,
                                  });
                                  router.push(`/dashboard/reports/new?${params.toString()}`);
                                }
                              }}
                            />
                          ))}
                          {user?.role === "admin" && (
                            <button
                              className="w-full h-7 flex items-center justify-center text-gray-300 hover:text-teal-500 hover:bg-teal-50 rounded border border-dashed border-gray-200 hover:border-teal-300 transition-colors"
                              onClick={() => openNewSlot(day, hour)}
                              title={`Tambah slot ${DAY_LABELS[day]} ${String(hour).padStart(2, "0")}:00`}
                            >
                              <PlusIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500">Total Slot</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{slots.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500">Pasien Terjadwal</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Set(slots.map((s) => s.patientId)).size}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500">Terapis Aktif</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {new Set(slots.map((s) => s.therapistId)).size}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500">Hari Terpadat</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {(() => {
              if (slots.length === 0) return "—";
              const counts = DAYS.map((d) => ({
                day: DAY_LABELS[d],
                count: slots.filter((s) => s.day === d).length,
              }));
              const max = counts.reduce((a, b) => (a.count > b.count ? a : b));
              return max.count > 0 ? max.day : "—";
            })()}
          </p>
        </div>
      </div>

      {/* Slot modal (admin only) */}
      {showModal && editingSlot !== null && (
        <SlotModal
          slot={editingSlot}
          patients={allPatients}
          therapists={allTherapists}
          weekStart={weekStart}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={editingSlot._id ? handleDelete : undefined}
        />
      )}

    </div>
  );
}
