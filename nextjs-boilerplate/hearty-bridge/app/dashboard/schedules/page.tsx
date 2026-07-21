"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  CalendarIcon,
  ClipboardListIcon,
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
  packageId?: string | null;
  totalSessions?: number | null;
  effectiveUntil?: string | null;
  sessionProgress?: { completed: number; total: number; sessionNumber: number | null } | null;
  sessionId?: string | null;
  sessionStatus?: string | null;
  _type?: 'session' | 'weekly';
}

interface AssessmentSlot {
  _id: string;
  childId: { _id: string; name: string } | string;
  assessorId: { _id: string; name: string; email: string } | null;
  date: string;
  time: string;
  duration: number;
  type: 'in-person' | 'video';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
  result: {
    OT: { conducted: boolean; needsTherapy: boolean | null; notes: string } | null;
    TW: { conducted: boolean; needsTherapy: boolean | null; notes: string } | null;
  };
}

interface PatientOption {
  _id: string;
  name: string;
  diagnosis: string;
  assignedTherapistId?: string;
  assignedTherapistName?: string;
  tokenBalance?: number;
  therapyBalance?: Record<string, number>;
  activePackageCount?: number;
}

interface TherapistOption {
  _id: string;
  name: string;
  therapyType?: 'OT' | 'TW' | null;
}

/** Format therapy balance breakdown for patient dropdown labels.
 * e.g. { OT: 8 } → "8 sesi OT"
 * e.g. { OT: 8, TW: 12 } → "8 sesi OT · 12 sesi TW"
 * Falls back to total tokenBalance if no breakdown available.
 */
function formatTherapyLabel(p: PatientOption): string {
  const breakdown = p.therapyBalance ?? {};
  const entries = Object.entries(breakdown).filter(([, v]) => v > 0);
  if (entries.length === 0) return `${p.tokenBalance ?? 0} sesi tersisa`;
  return entries.map(([type, count]) => `${count} sesi ${type}`).join(' · ');
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
  patientPhotoUrl,
  onClick,
  onOpenReportModal,
}: {
  slot: WeeklySlot;
  isOwn: boolean;
  isParentView: boolean;
  weekStart: string;
  reportMap: Record<string, string>;
  patientPhotoUrl?: string | null;
  onClick: () => void;
  onOpenReportModal: (slot: WeeklySlot, sessionDate: string) => void;
}) {
  const highlight = isOwn || isParentView;
  const sessionDate = slotSessionDate(weekStart, slot.day);
  const hasReport = !!reportMap[`${slot.patientId}_${sessionDate}`];
  const sp = slot.sessionProgress;
  const currentNum = sp?.sessionNumber ?? (sp ? sp.completed + 1 : null);

  return (
    <div
      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm hover:-translate-y-px ${
        highlight
          ? "bg-teal-50 border-teal-200 hover:bg-teal-100"
          : "bg-blue-50 border-blue-100 hover:bg-blue-100"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0 relative">
            <span className="text-[9px] font-bold text-teal-600 leading-none">
              {slot.patientName.charAt(0).toUpperCase()}
            </span>
            {patientPhotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patientPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}
          </div>
          <p className="font-semibold text-gray-900 truncate leading-snug">
            {slot.patientName}{slot.therapyType ? ` (${slot.therapyType})` : ''}
          </p>
        </div>
        {sp && currentNum !== null && (
          <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-600 text-white leading-none">
            {currentNum}/{sp.total}
          </span>
        )}
      </div>
      <p
        className={`truncate text-[11px] leading-snug mt-0.5 ${
          highlight ? "text-teal-700" : "text-blue-700"
        }`}
      >
        {slot.therapistName.replace(/,.*/, "")}
      </p>
      {/* Session status badge for package slots */}
      {slot.sessionId && (
        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${
          slot.sessionStatus === 'completed' ? 'bg-green-100 text-green-700' :
          slot.sessionStatus === 'no-show' ? 'bg-red-100 text-red-700' :
          slot.sessionStatus === 'cancelled' ? 'bg-gray-100 text-gray-500' :
          'bg-sky-100 text-sky-700'
        }`}>
          {slot.sessionStatus === 'completed' ? 'Terlaksana' :
           slot.sessionStatus === 'no-show' ? 'Tidak hadir' :
           slot.sessionStatus === 'cancelled' ? 'Dibatalkan' :
           'Terjadwal'}
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
// AssessmentCard — compact card for assessment slots in the grid
// ---------------------------------------------------------------------------

function AssessmentCard({
  assessment,
  onClick,
}: {
  assessment: AssessmentSlot;
  onClick: () => void;
}) {
  const childName =
    typeof assessment.childId === 'object' ? assessment.childId.name : '—';
  const assessorName = assessment.assessorId
    ? typeof assessment.assessorId === 'object'
      ? assessment.assessorId.name
      : '—'
    : 'Belum ada assessor';

  return (
    <div
      className="p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm hover:-translate-y-px bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-1 mb-0.5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white leading-none shrink-0">
          ASESMEN
        </span>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium leading-none ${
            assessment.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : assessment.status === 'cancelled'
              ? 'bg-gray-100 text-gray-500'
              : assessment.status === 'no-show'
              ? 'bg-red-100 text-red-700'
              : 'bg-sky-100 text-sky-700'
          }`}
        >
          {assessment.status === 'completed'
            ? 'Selesai'
            : assessment.status === 'cancelled'
            ? 'Dibatalkan'
            : assessment.status === 'no-show'
            ? 'Tidak Hadir'
            : 'Terjadwal'}
        </span>
      </div>
      <p className="font-semibold text-gray-900 truncate leading-snug">{childName}</p>
      <p className="truncate text-[11px] leading-snug text-indigo-700 mt-0.5">
        {assessorName.replace(/,.*/, '')}
      </p>
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
  onAssignPackage?: (slot: Partial<WeeklySlot>) => void;
  showTabs?: boolean;
  onSaveAssessment?: (data: { childId: string; assessorId: string | null; date: string; time: string; notes: string }) => Promise<void>;
}

function SlotModal({
  slot,
  patients,
  therapists,
  weekStart,
  onClose,
  onSave,
  onDelete,
  onAssignPackage,
  showTabs,
  onSaveAssessment,
}: SlotModalProps) {
  const canShowTabs = showTabs && !slot._id;
  const [activeTab, setActiveTab] = useState<'slot' | 'assessment'>('slot');

  // Assessment form state
  const defaultAssessDate = (() => {
    const offset = dayNameToOffset(slot.day || 'senin');
    return offset >= 0 ? addDays(weekStart, offset) : weekStart;
  })();
  const [assessForm, setAssessForm] = useState({
    childId: '',
    assessorId: '',
    date: defaultAssessDate,
    time: `${String(slot.hour ?? 9).padStart(2, '0')}:00`,
    notes: '',
  });

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
  const [patientTherapyTypes, setPatientTherapyTypes] = useState<string[]>(
    slot.therapyType ? [slot.therapyType] : []
  );

  useEffect(() => {
    if (!form.patientId) {
      setPatientTherapyTypes([]);
      return;
    }
    const token = localStorage.getItem('token');
    fetch(`/api/children/${form.patientId}/tokens`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const topups = (data.data?.transactions ?? []).filter(
          (t: any) => t.type === 'topup' && t.packageType
        );
        // Collect types from packages with a specific therapyType (OT or TW).
        // 'both' packages (therapyType null) are ignored for filtering — if the
        // patient has no specific-type packages at all, show all therapists.
        const specificTypes: string[] = Array.from(
          new Set<string>(
            topups.filter((t: any) => t.therapyType).map((t: any) => t.therapyType as string)
          )
        );
        setPatientTherapyTypes(specificTypes);
      })
      .catch(() => setPatientTherapyTypes([]));
  }, [form.patientId]);

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

  const handleSaveAssessment = async () => {
    if (!assessForm.childId || !assessForm.date) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveAssessment!({
        childId: assessForm.childId,
        assessorId: assessForm.assessorId || null,
        date: assessForm.date,
        time: assessForm.time,
        notes: assessForm.notes,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan asesmen.');
      setSaving(false);
    }
  };

  const isValid = Boolean(form.patientId && form.therapistId && form.day);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {activeTab === 'assessment' && (
                <ClipboardListIcon className="h-4 w-4 text-indigo-600" />
              )}
              {slot._id ? "Edit Slot Jadwal" : activeTab === 'assessment' ? "Jadwalkan Asesmen" : "Tambah Slot Jadwal"}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Tabs — only when adding new (not editing) and admin */}
        {canShowTabs && (
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 mt-3">
            <button
              onClick={() => setActiveTab('slot')}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'slot'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Jadwal Terapi
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'assessment'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardListIcon className="h-3.5 w-3.5" />
              Asesmen
            </button>
          </div>
        )}

        {/* ── Slot Tab Content ── */}
        {activeTab === 'slot' && (
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

          {/* Patient — only those with active package (tokenBalance > 0) */}
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
              {patients
                .filter((p) => (p.tokenBalance ?? 0) > 0)
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({formatTherapyLabel(p)})
                  </option>
                ))}
            </select>
            {patients.filter((p) => (p.tokenBalance ?? 0) > 0).length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Semua pasien aktif sudah terjadwal minggu ini.
              </p>
            )}
          </div>

          {/* Therapist — filtered by patient's active package therapyType, disabled until patient selected */}
          <div>
            <label className={`text-xs font-medium mb-1 flex items-center gap-1.5 ${form.patientId ? 'text-gray-700' : 'text-gray-400'}`}>
              <StethoscopeIcon className="inline h-3 w-3" />
              Terapis
              {patientTherapyTypes.map((type) => (
                <span key={type} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  type === 'OT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {type}
                </span>
              ))}
            </label>
            <select
              value={form.therapistId}
              onChange={(e) => handleTherapistChange(e.target.value)}
              disabled={!form.patientId}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <option value="">Pilih terapis...</option>
              {(patientTherapyTypes.length > 0
                ? therapists.filter((t) => t.therapyType == null || patientTherapyTypes.includes(t.therapyType!))
                : therapists
              ).map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            {patientTherapyTypes.length > 0 &&
              therapists.filter((t) => patientTherapyTypes.includes(t.therapyType!)).length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Belum ada terapis {patientTherapyTypes.join('/')} terdaftar.
              </p>
            )}
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
        )} {/* end slot tab */}

        {/* ── Assessment Tab Content ── */}
        {activeTab === 'assessment' && (
          <div className="space-y-4 mt-4">
            {saveError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            )}

            {/* Child */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                <UserIcon className="inline h-3 w-3 mr-1" />
                Anak
              </label>
              <select
                value={assessForm.childId}
                onChange={(e) => setAssessForm((f) => ({ ...f, childId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Pilih anak...</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}{p.diagnosis ? ` — ${p.diagnosis.slice(0, 30)}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Assessor */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                <StethoscopeIcon className="inline h-3 w-3 mr-1" />
                Assessor <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <select
                value={assessForm.assessorId}
                onChange={(e) => setAssessForm((f) => ({ ...f, assessorId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Belum ditentukan</option>
                {therapists.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}{t.therapyType ? ` (${t.therapyType})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Tanggal</label>
                <input
                  type="date"
                  value={assessForm.date}
                  onChange={(e) => setAssessForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  <ClockIcon className="inline h-3 w-3 mr-1" />
                  Jam
                </label>
                <select
                  value={assessForm.time}
                  onChange={(e) => setAssessForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Catatan <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea
                value={assessForm.notes}
                onChange={(e) => setAssessForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Catatan sebelum asesmen..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer buttons */}
        {activeTab === 'slot' ? (
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-2">
              {slot._id && onDelete && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Menghapus..." : "Hapus Slot"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={!isValid || saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button
              onClick={handleSaveAssessment}
              disabled={!assessForm.childId || !assessForm.date || saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
            >
              {saving ? 'Menyimpan...' : 'Jadwalkan'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// PackageSessionModal — schedule first session for a package; rest auto-generate
// ---------------------------------------------------------------------------

const PACKAGE_META: Record<string, { label: string; emoji: string; color: string }> = {
  gold:     { label: "Gold",     emoji: "🥇", color: "bg-yellow-50 border-yellow-300 text-yellow-800" },
  platinum: { label: "Platinum", emoji: "🥈", color: "bg-slate-50 border-slate-300 text-slate-800" },
  diamond:  { label: "Diamond",  emoji: "💎", color: "bg-sky-50 border-sky-300 text-sky-800" },
};

interface ActivePackageInfo {
  packageType: string;
  therapyType: 'OT' | 'TW' | null;
  totalSessions: number;
  balance: number;
  usedSessions: number;
  note: string;
  createdAt: string;
}

function PackageSessionModal({
  patients,
  therapists,
  weekStart,
  onClose,
  onSave,
}: {
  patients: PatientOption[];
  therapists: TherapistOption[];
  weekStart: string;
  onClose: () => void;
  onSave: (childId: string, date: string, hour: number, therapistId: string) => Promise<void>;
}) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedTherapistId, setSelectedTherapistId] = useState("");
  const [date, setDate] = useState(weekStart);
  const [hour, setHour] = useState<number>(9);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packageInfo, setPackageInfo] = useState<ActivePackageInfo | null>(null);
  const [packageLoading, setPackageLoading] = useState(false);

  const eligiblePatients = patients.filter((p) => (p.tokenBalance ?? 0) > 0);
  const selectedPatient = eligiblePatients.find((p) => p._id === selectedPatientId);

  // Fetch active package info when patient changes
  useEffect(() => {
    if (!selectedPatientId) {
      setPackageInfo(null);
      setSelectedTherapistId("");
      return;
    }
    setPackageLoading(true);
    setPackageInfo(null);
    setSelectedTherapistId("");
    const token = localStorage.getItem("token");
    fetch(`/api/children/${selectedPatientId}/tokens`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        const transactions: any[] = res.data?.transactions ?? [];
        const balance: number = res.data?.balance ?? 0;
        const activeTx = transactions.find(
          (t) => t.type === "topup" && t.packageType
        );
        if (activeTx) {
          setPackageInfo({
            packageType: activeTx.packageType,
            therapyType: activeTx.therapyType ?? null,
            totalSessions: activeTx.amount,
            balance,
            usedSessions: activeTx.amount - balance,
            note: activeTx.note ?? "",
            createdAt: activeTx.createdAt ?? "",
          });
        } else {
          setPackageInfo(null);
        }
      })
      .catch(() => setPackageInfo(null))
      .finally(() => setPackageLoading(false));
  }, [selectedPatientId]);

  const handleSave = async () => {
    if (!selectedPatientId || !date || !selectedTherapistId) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(selectedPatientId, date, hour, selectedTherapistId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menjadwalkan sesi");
    } finally {
      setSaving(false);
    }
  };

  const eligibleTherapists = packageInfo?.therapyType
    ? therapists.filter(
        (t) => t.therapyType == null || t.therapyType === packageInfo.therapyType
      )
    : therapists;

  const pkgMeta = packageInfo ? PACKAGE_META[packageInfo.packageType] : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Tambah Sesi Paket</DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            Tentukan jadwal sesi pertama. Sesi 2 hingga sesi terakhir akan <strong>otomatis dibuat</strong> setiap minggu pada hari yang sama.
          </div>

          {/* Patient */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              <UserIcon className="inline h-3 w-3 mr-1" />
              Pasien (paket aktif)
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Pilih pasien...</option>
              {eligiblePatients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({formatTherapyLabel(p)})
                </option>
              ))}
            </select>
            {eligiblePatients.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Tidak ada pasien dengan paket aktif. Assign paket di halaman detail pasien terlebih dahulu.
              </p>
            )}
          </div>

          {/* Active package preview */}
          {selectedPatientId && (
            <div>
              {packageLoading ? (
                <div className="rounded-lg border border-gray-200 p-3 text-xs text-gray-400 text-center">
                  Memuat info paket...
                </div>
              ) : packageInfo && pkgMeta ? (
                <div className={`rounded-lg border p-3 ${pkgMeta.color}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm">
                      {pkgMeta.emoji} Paket {pkgMeta.label}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 border border-current">
                      Aktif
                    </span>
                  </div>
                  {packageInfo.therapyType && (
                    <p className="text-xs font-semibold mb-2 opacity-80">
                      {packageInfo.therapyType === 'OT'
                        ? '🖐 Paket ini untuk Terapi Okupasi (OT)'
                        : '🗣 Paket ini untuk Terapi Wicara (TW)'}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-white/50 px-2 py-1.5">
                      <p className="text-[10px] leading-tight opacity-70">Total Sesi</p>
                      <p className="font-bold text-base leading-tight">{packageInfo.totalSessions}</p>
                    </div>
                    <div className="rounded bg-white/50 px-2 py-1.5">
                      <p className="text-[10px] leading-tight opacity-70">Terpakai</p>
                      <p className="font-bold text-base leading-tight">{packageInfo.usedSessions}</p>
                    </div>
                    <div className="rounded bg-white/50 px-2 py-1.5">
                      <p className="text-[10px] leading-tight opacity-70">Sisa</p>
                      <p className="font-bold text-base leading-tight">{packageInfo.balance}</p>
                    </div>
                  </div>
                  {packageInfo.createdAt && (
                    <p className="text-[10px] opacity-60 mt-2">
                      Assigned:{" "}
                      {new Date(packageInfo.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  Tidak ada paket aktif ditemukan untuk pasien ini.
                </div>
              )}
            </div>
          )}

          {/* Therapist — filtered by package therapyType, no need to re-select therapy type */}
          {selectedPatientId && packageInfo && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                <StethoscopeIcon className="inline h-3 w-3 mr-1" />
                Pilih Terapis
              </label>
              <select
                value={selectedTherapistId}
                onChange={(e) => setSelectedTherapistId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Pilih terapis...</option>
                {eligibleTherapists.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
              {eligibleTherapists.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Belum ada terapis {packageInfo.therapyType} terdaftar.
                </p>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              Tanggal Sesi Pertama
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Hour */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">
              <ClockIcon className="inline h-3 w-3 mr-1" />
              Jam
            </label>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00 – {String(h + 1).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          {/* Schedule summary */}
          {selectedPatient && packageInfo && date && (
            <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800">
              <p className="font-semibold mb-1">Ringkasan jadwal yang akan dibuat:</p>
              <p>
                📅 Sesi 1/{packageInfo.balance} → {new Date(date + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-teal-600 mt-0.5">
                🔁 Sesi 2/{packageInfo.balance} s/d {packageInfo.balance}/{packageInfo.balance} → otomatis setiap minggu (hari yang sama)
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedPatientId || !date || !selectedTherapistId || saving || eligiblePatients.length === 0 || !packageInfo}
          >
            {saving ? "Menjadwalkan..." : "Buat Jadwal Sesi"}
          </Button>
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
  const scheduledPatientIds = useMemo(() => new Set(slots.map((s) => s.patientId)), [slots]);
  // Count how many slots each patient currently has in the schedule
  const scheduledSlotCountByPatient = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of slots) {
      map.set(s.patientId, (map.get(s.patientId) ?? 0) + 1);
    }
    return map;
  }, [slots]);
  // Patient is eligible if they have fewer slots than active packages
  const unscheduledPatients = useMemo(
    () => allPatients.filter((p) =>
      (p.tokenBalance ?? 0) > 0 &&
      (scheduledSlotCountByPatient.get(p._id) ?? 0) < (p.activePackageCount ?? 1)
    ),
    [allPatients, scheduledSlotCountByPatient]
  );
  const [patientPhotoMap, setPatientPhotoMap] = useState<Record<string, string>>({});

  // Reschedule modal state
  const [rescheduleSlot, setRescheduleSlot] = useState<WeeklySlot | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [markStatusLoading, setMarkStatusLoading] = useState(false);

  // Package session modal state
  const [showPackageModal, setShowPackageModal] = useState(false);

  // Assessment state
  const [assessments, setAssessments] = useState<AssessmentSlot[]>([]);
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentSlot | null>(null);
  const [assessmentStatusLoading, setAssessmentStatusLoading] = useState(false);
  const [editAssessorId, setEditAssessorId] = useState('');
  const [assessorSaving, setAssessorSaving] = useState(false);


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

  // ---- Fetch assessments for the current week ----

  const fetchAssessments = useCallback(async () => {
    if (!user) return;
    if (user.role === 'parent') return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/assessments?week=${weekStart}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setAssessments(result.data?.assessments ?? []);
      }
    } catch {
      // silently fail — assessments section just won't show
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
            tokenBalance: c.tokenBalance ?? 0,
            therapyBalance: c.therapyBalance ?? {},
            activePackageCount: c.activePackageCount ?? 0,
          }))
        );
        // Build photo map from the same response
        const map: Record<string, string> = {};
        for (const c of rawChildren) {
          if (c.photoUrl && c.id) map[c.id] = c.photoUrl;
        }
        setPatientPhotoMap(map);
      }
      if (tRes.ok) {
        const tr = await tRes.json();
        const rawTherapists: any[] = tr.therapists || [];
        setAllTherapists(rawTherapists.map((t) => ({
          _id: t._id?.toString() ?? "",
          name: t.name,
          therapyType: t.therapyType ?? null,
        })));
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  }, []);

  // For therapist and parent: fetch children to build photo map
  const fetchPhotoMap = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/children?limit=200", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const pr = await res.json();
        const rawChildren: any[] = pr.children || [];
        const map: Record<string, string> = {};
        for (const c of rawChildren) {
          if (c.photoUrl && c.id) map[c.id] = c.photoUrl;
        }
        setPatientPhotoMap(map);
      }
    } catch {
      // silently fail — photos just won't show
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSlots();
      fetchAssessments();
      if (user.role === "admin" || user.role === "super_admin") fetchDropdownData();
      else fetchPhotoMap();
    }
  }, [user, weekStart, fetchSlots, fetchAssessments, fetchDropdownData, fetchPhotoMap]);

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

  // ---- Reschedule handler ----

  const handleReschedule = async () => {
    if (!rescheduleSlot?.sessionId || !rescheduleDate) return;
    setRescheduleLoading(true);
    setRescheduleError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/sessions/${rescheduleSlot.sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: rescheduleDate }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Gagal reschedule (${res.status})`);
      }
      setRescheduleSlot(null);
      setRescheduleDate("");
      await fetchSlots();
    } catch (e) {
      setRescheduleError(e instanceof Error ? e.message : "Gagal reschedule");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleMarkStatus = async (status: 'completed' | 'no-show' | 'cancelled') => {
    if (!rescheduleSlot?.sessionId) return;
    setMarkStatusLoading(true);
    setRescheduleError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/sessions/${rescheduleSlot.sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Gagal mengubah status (${res.status})`);
      }
      setRescheduleSlot(null);
      setRescheduleDate("");
      await fetchSlots();
    } catch (e) {
      setRescheduleError(e instanceof Error ? e.message : "Gagal mengubah status");
    } finally {
      setMarkStatusLoading(false);
    }
  };

  // ---- Package session creation ----

  const handleCreatePackageSessions = async (childId: string, date: string, hour: number, therapistId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ packageMode: true, date, hour, therapistId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal menjadwalkan sesi (${res.status})`);
    }
    setShowPackageModal(false);
    await fetchSlots();
  };

  // ---- Modal helpers ----

  const openNewSlot = (day?: string, hour?: number) => {
    setEditingSlot({ day: day || "senin", hour: hour ?? 9 });
    setShowModal(true);
  };

  const openEditSlot = (slot: WeeklySlot) => {
    if (slot.packageId && slot.sessionId) {
      // Package-bound slot with a session this week → open reschedule modal
      setRescheduleSlot(slot);
      const currentDate = slotSessionDate(weekStart, slot.day);
      setRescheduleDate(currentDate);
    } else {
      // Non-package slot or no session this week → open standard slot editor
      setEditingSlot(slot);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSlot(null);
  };

  // ---- Assessment mutation ----

  const handleCreateAssessment = async (data: {
    childId: string;
    assessorId: string | null;
    date: string;
    time: string;
    notes: string;
  }) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...data, type: 'in-person' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal membuat asesmen (${res.status})`);
    }
    await fetchAssessments();
  };

  const handleAssessmentStatus = async (id: string, status: 'cancelled' | 'no-show') => {
    setAssessmentStatusLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/assessments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setAssessmentDetail(null);
      await fetchAssessments();
    } finally {
      setAssessmentStatusLoading(false);
    }
  };

  const handleAssignAssessor = async (id: string) => {
    setAssessorSaving(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/assessments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assessorId: editAssessorId || null }),
      });
      setAssessmentDetail(null);
      await fetchAssessments();
    } finally {
      setAssessorSaving(false);
    }
  };

  // ---- Grid helpers ----

  const getSlotsForCell = (day: string, hour: number) =>
    slots.filter((s) => s.day === day && s.hour === hour);

  const getAssessmentsForCell = (day: string, hour: number) => {
    const dayIndex = DAYS.indexOf(day as Day);
    if (dayIndex < 0) return [];
    const dateStr = weekDates[dayIndex];
    return assessments.filter((a) => {
      const aDate = typeof a.date === 'string' ? a.date.split('T')[0] : '';
      const aHour = parseInt(a.time.split(':')[0], 10);
      return aDate === dateStr && aHour === hour;
    });
  };

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
            {(user?.role === "admin" || user?.role === "super_admin") && "Template jadwal terapi — berlaku setiap minggu"}
            {user?.role === "therapist" && "Jadwal sesi terapi Anda setiap minggu"}
            {user?.role === "parent" && "Jadwal sesi terapi anak Anda"}
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "super_admin") && (
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
          <span className="flex items-center gap-1.5 ml-2">
            <span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-200 inline-block" />
            Asesmen
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
                          {getAssessmentsForCell(day, hour).map((a) => (
                            <AssessmentCard
                              key={a._id}
                              assessment={a}
                              onClick={() => {
                                if (user?.role === 'admin' || user?.role === 'super_admin') {
                                  setAssessmentDetail(a);
                                  const aid = a.assessorId;
                                  setEditAssessorId(aid ? (typeof aid === 'object' ? aid._id : aid) : '');
                                }
                              }}
                            />
                          ))}
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
                              patientPhotoUrl={patientPhotoMap[slot.patientId] ?? null}
                              onClick={() => {
                                if (user?.role === "admin" || user?.role === "super_admin") openEditSlot(slot);
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
                          {(user?.role === "admin" || user?.role === "super_admin") && (
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


      {/* Assessment detail modal — admin can change status / assign assessor */}
      {assessmentDetail && (
        <Dialog open onOpenChange={(o) => { if (!o) setAssessmentDetail(null); }}>
          <DialogContent size="sm">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardListIcon className="h-4 w-4 text-indigo-600" />
                  Detail Asesmen
                </DialogTitle>
                <button onClick={() => setAssessmentDetail(null)} className="text-gray-400 hover:text-gray-600">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-sm">
                <p className="font-semibold text-indigo-800">
                  {typeof assessmentDetail.childId === 'object' ? assessmentDetail.childId.name : '—'}
                </p>
                <p className="text-indigo-600 text-xs mt-0.5">
                  Assessor:{' '}
                  {assessmentDetail.assessorId
                    ? typeof assessmentDetail.assessorId === 'object'
                      ? assessmentDetail.assessorId.name
                      : '—'
                    : 'Belum ditentukan'}
                </p>
                <p className="text-indigo-600 text-xs mt-0.5">
                  {new Date(assessmentDetail.date).toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}{' '}
                  · {assessmentDetail.time} ·{' '}
                  {assessmentDetail.type === 'in-person' ? 'Tatap Langsung' : 'Video Call'}
                </p>
                {assessmentDetail.notes && (
                  <p className="text-indigo-700 text-xs mt-1.5 italic">"{assessmentDetail.notes}"</p>
                )}
              </div>

              {/* Assign / change assessor */}
              {assessmentDetail.status !== 'cancelled' && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Assessor</p>
                  <div className="flex gap-2">
                    <select
                      value={editAssessorId}
                      onChange={(e) => setEditAssessorId(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Belum ditentukan</option>
                      {allTherapists.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}{t.therapyType ? ` (${t.therapyType})` : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleAssignAssessor(assessmentDetail._id)}
                      disabled={assessorSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                    >
                      {assessorSaving ? '...' : 'Simpan'}
                    </Button>
                  </div>
                </div>
              )}

              {assessmentDetail.status === 'scheduled' && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Ubah Status</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAssessmentStatus(assessmentDetail._id, 'cancelled')}
                      disabled={assessmentStatusLoading}
                      className="flex-1 px-3 py-2 rounded-md text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    >
                      — Batalkan
                    </button>
                    <button
                      onClick={() => handleAssessmentStatus(assessmentDetail._id, 'no-show')}
                      disabled={assessmentStatusLoading}
                      className="flex-1 px-3 py-2 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors"
                    >
                      ✕ Tidak Hadir
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                Untuk mengisi hasil asesmen, buka profil anak.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Package session modal (admin only) */}
      {showPackageModal && (
        <PackageSessionModal
          patients={unscheduledPatients}
          therapists={allTherapists}
          weekStart={weekStart}
          onClose={() => setShowPackageModal(false)}
          onSave={handleCreatePackageSessions}
        />
      )}

      {/* Slot modal (admin only) */}
      {showModal && editingSlot !== null && (
        <SlotModal
          slot={editingSlot}
          patients={editingSlot._id ? allPatients : unscheduledPatients}
          therapists={allTherapists}
          weekStart={weekStart}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={editingSlot._id ? handleDelete : undefined}
          showTabs={user?.role === 'admin' || user?.role === 'super_admin'}
          onSaveAssessment={handleCreateAssessment}
        />
      )}

      {/* Kelola Sesi modal */}
      {rescheduleSlot && (
        <Dialog open onOpenChange={(o) => { if (!o) { setRescheduleSlot(null); setRescheduleDate(""); setRescheduleError(null); } }}>
          <DialogContent size="sm">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Kelola Sesi</DialogTitle>
                <button onClick={() => { setRescheduleSlot(null); setRescheduleDate(""); }} className="text-gray-400 hover:text-gray-600"><XIcon className="h-4 w-4" /></button>
              </div>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-teal-50 border border-teal-100 p-3 text-sm">
                <p className="font-semibold text-teal-800">{rescheduleSlot.patientName}</p>
                <p className="text-teal-600 text-xs mt-0.5">{rescheduleSlot.therapistName}</p>
                {rescheduleSlot.sessionProgress && rescheduleSlot.sessionProgress.sessionNumber && (
                  <p className="text-teal-700 text-xs mt-1 font-medium">
                    Sesi ke-{rescheduleSlot.sessionProgress.sessionNumber} dari {rescheduleSlot.sessionProgress.total}
                  </p>
                )}
                {rescheduleSlot.sessionStatus && rescheduleSlot.sessionStatus !== 'scheduled' && (
                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                    rescheduleSlot.sessionStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    rescheduleSlot.sessionStatus === 'no-show' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {rescheduleSlot.sessionStatus === 'completed' ? 'Terlaksana' :
                     rescheduleSlot.sessionStatus === 'no-show' ? 'Tidak hadir' : 'Dibatalkan'}
                  </span>
                )}
              </div>

              {/* Status actions */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Ubah Status Sesi</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleMarkStatus('completed')}
                    disabled={markStatusLoading || rescheduleSlot.sessionStatus === 'completed'}
                    className="flex-1 px-3 py-2 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ✓ Terlaksana
                  </button>
                  <button
                    onClick={() => handleMarkStatus('no-show')}
                    disabled={markStatusLoading || rescheduleSlot.sessionStatus === 'no-show'}
                    className="flex-1 px-3 py-2 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ✕ Tidak Hadir
                  </button>
                  <button
                    onClick={() => handleMarkStatus('cancelled')}
                    disabled={markStatusLoading || rescheduleSlot.sessionStatus === 'cancelled'}
                    className="flex-1 px-3 py-2 rounded-md text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    — Dibatalkan
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-3">
                {rescheduleError && (
                  <p className="text-red-600 text-sm bg-red-50 rounded p-2">{rescheduleError}</p>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Pindahkan Tanggal Sesi</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setRescheduleSlot(null); setRescheduleDate(""); }} disabled={rescheduleLoading || markStatusLoading}>Batal</Button>
                  <Button onClick={handleReschedule} disabled={!rescheduleDate || rescheduleLoading || markStatusLoading}>
                    {rescheduleLoading ? "Menyimpan..." : "Pindahkan Sesi"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}


    </div>
  );
}
