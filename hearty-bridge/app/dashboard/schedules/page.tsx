"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { usePermissions } from "@/lib/utils/permissions";
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
  SearchIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function dateUTCStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Current instant shifted so its UTC getters read as WIB (UTC+7) wall-clock time. */
function nowWIB(): Date {
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}

function getCurrentMondayStr(): string {
  const now = nowWIB();
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

const DOW_NAMES = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];

/** Day name (senin..sabtu) for a YYYY-MM-DD date string, or null if it falls on Sunday. */
function dateStrToDayName(dateStr: string): string | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 ? null : DOW_NAMES[dow];
}

/** Monday (UTC) of the week containing the given YYYY-MM-DD date string. */
function mondayOfDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay();
  const toMon = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + toMon);
  return dateUTCStr(dt);
}

function getTodayStr(): string {
  return dateUTCStr(nowWIB());
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
  sessionCategory?: 'regular' | 'extra';
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
  color?: string | null;
}

/** Format therapy balance breakdown for patient dropdown labels.
 * e.g. { OT: 8 } → "8 sesi OT"
 * e.g. { OT: 8, TW: 12 } → "8 sesi OT · 12 sesi TW"
 * Falls back to total tokenBalance if no breakdown available.
 */
function formatTherapyLabel(p: PatientOption): string {
  const breakdown = p.therapyBalance ?? {};
  const entries = Object.entries(breakdown).filter(([type, v]) => type !== 'assessment' && v > 0);
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
  isTherapistOnLeave,
  therapistColor,
  onClick,
  onOpenReportModal,
}: {
  slot: WeeklySlot;
  isOwn: boolean;
  isParentView: boolean;
  weekStart: string;
  reportMap: Record<string, string>;
  patientPhotoUrl?: string | null;
  isTherapistOnLeave?: boolean;
  therapistColor?: string | null;
  onClick: () => void;
  onOpenReportModal: (slot: WeeklySlot, sessionDate: string) => void;
}) {
  const sessionDate = slotSessionDate(weekStart, slot.day);
  const hasReport = !!reportMap[`${slot.patientId}_${sessionDate}`];
  const isExtra = slot.sessionCategory === 'extra';
  const sp = slot.sessionProgress;
  const currentNum = isExtra ? null : (sp?.sessionNumber ?? (sp ? sp.completed + 1 : null));

  const tc = slot.therapyType === 'OT' ? {
    card: isTherapistOnLeave ? 'bg-red-50 border-red-300 hover:bg-red-100' : 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    avatar: 'bg-blue-100 border-blue-200',
    avatarText: 'text-blue-600',
    badge: 'bg-blue-600',
    text: 'text-blue-700',
  } : slot.therapyType === 'TW' ? {
    card: isTherapistOnLeave ? 'bg-red-50 border-red-300 hover:bg-red-100' : 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    avatar: 'bg-purple-100 border-purple-200',
    avatarText: 'text-purple-600',
    badge: 'bg-purple-600',
    text: 'text-purple-700',
  } : slot.therapyType === 'HB' ? {
    card: isTherapistOnLeave ? 'bg-red-50 border-red-300 hover:bg-red-100' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    avatar: 'bg-emerald-100 border-emerald-200',
    avatarText: 'text-emerald-600',
    badge: 'bg-emerald-600',
    text: 'text-emerald-700',
  } : {
    card: isTherapistOnLeave ? 'bg-red-50 border-red-300 hover:bg-red-100' : 'bg-slate-50 border-slate-200 hover:bg-slate-100',
    avatar: 'bg-slate-100 border-slate-200',
    avatarText: 'text-slate-600',
    badge: 'bg-slate-500',
    text: 'text-slate-600',
  };

  return (
    <div
      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm hover:-translate-y-px relative ${tc.card}`}
      style={therapistColor ? { borderLeftWidth: 4, borderLeftColor: therapistColor } : undefined}
      onClick={onClick}
    >
      <div className="flex gap-2">
        {/* Avatar — large, left column */}
        <div className={`w-10 h-10 rounded-full overflow-hidden ${tc.avatar} border-2 flex items-center justify-center shrink-0 relative`}>
          <span className={`text-sm font-bold ${tc.avatarText} leading-none`}>
            {slot.patientName.charAt(0).toUpperCase()}
          </span>
          {patientPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={patientPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>

        {/* Content — right column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="font-semibold text-gray-900 truncate leading-snug">
              {slot.patientName}{slot.therapyType ? ` (${slot.therapyType})` : ''}
            </p>
            {isExtra && (
              <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                Susulan
              </span>
            )}
            {!isExtra && sp && currentNum !== null && (
              <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tc.badge} text-white leading-none`}>
                {currentNum}/{sp.total}
              </span>
            )}
            {slot.therapyType === 'HB' && (
              <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tc.badge} text-white leading-none`}>
                Sekali
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            <p className={`truncate text-[11px] leading-snug ${tc.text}`}>
              {slot.therapistName.replace(/,.*/, "")}
            </p>
            {isTherapistOnLeave && (
              <span className="flex-shrink-0 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded leading-none">
                CUTI
              </span>
            )}
          </div>
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
          {isOwn && (
            <button
              className="mt-1 w-full text-left text-[10px] font-medium leading-snug"
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
      </div>
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

  const reportMissing =
    assessment.status === 'completed' &&
    !assessment.result?.OT &&
    !assessment.result?.TW;

  return (
    <div
      className={`p-2 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-sm hover:-translate-y-px ${
        reportMissing
          ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
          : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
      }`}
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
      {reportMissing && (
        <p className="mt-1 text-[10px] font-semibold text-amber-700 flex items-center gap-0.5">
          ⚠️ Laporan belum diisi
        </p>
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
  onAssignPackage?: (slot: Partial<WeeklySlot>) => void;
  showTabs?: boolean;
  onSaveAssessment?: (data: { childId: string; assessorId: string | null; date: string; time: string; notes: string; packageId?: string | null }) => Promise<void>;
  // Patients who already have an OT/TW slot somewhere this week — their
  // per-type `therapyBalance` reads 0 once a package is linked to a slot
  // (the whole budget gets front-loaded), but they're still a valid pick for
  // adding a 2nd/3rd day to that same package (see multi-day scheduling).
  patientsWithActiveSlot?: Set<string>;
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
  patientsWithActiveSlot,
}: SlotModalProps) {
  const canShowTabs = showTabs && !slot._id;
  const [activeTab, setActiveTab] = useState<'slot' | 'assessment'>('slot');

  // A patient is pickable for a new regular (OT/TW) slot if they have spare
  // per-type balance, OR they already have an active OT/TW slot this week —
  // the latter covers adding a 2nd/3rd day to a package whose whole budget
  // is already front-loaded onto its first slot (therapyBalance reads 0 for
  // that type even though the package itself isn't finished).
  const hasSchedulableBalance = (p: PatientOption) => {
    if (patientsWithActiveSlot?.has(p._id)) return true;
    if ((p.tokenBalance ?? 0) <= 0) return false;
    const b = p.therapyBalance ?? {};
    if (Object.keys(b).length === 0) return true; // 'both' packages have no breakdown
    return Object.entries(b).some(([type, v]) => type !== 'assessment' && (v as number) > 0);
  };

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
  const [isHeroBridge, setIsHeroBridge] = useState(slot.therapyType === 'HB');
  const [heroBridgeDate, setHeroBridgeDate] = useState(
    slotSessionDate(weekStart, slot.day || 'senin')
  );
  const [manualTherapistName, setManualTherapistName] = useState(slot.therapistName || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [patientTherapyTypes, setPatientTherapyTypes] = useState<string[]>(
    slot.therapyType ? [slot.therapyType] : []
  );
  // Broader than patientTherapyTypes (which only counts *unscheduled* balance,
  // always 0 once a package has any slot — by design, its budget is
  // front-loaded onto that slot). This is every non-assessment type the
  // patient has ever had a package for, used to decide whether OT vs TW needs
  // to be asked explicitly instead of guessed — with multi-day scheduling a
  // patient commonly has an active slot for both, and guessing "most
  // recently created package" silently picks the wrong one.
  const [typeCandidates, setTypeCandidates] = useState<string[]>(
    slot.therapyType ? [slot.therapyType] : []
  );
  const [assessmentPackageId, setAssessmentPackageId] = useState<string | null>(null);
  const [assessmentPackageLoading, setAssessmentPackageLoading] = useState(false);

  useEffect(() => {
    // Hero Bridge doesn't use packages/tokens — skip the lookup so the therapist
    // dropdown falls back to the full unfiltered list below.
    if (!form.patientId || isHeroBridge) {
      setPatientTherapyTypes([]);
      setTypeCandidates([]);
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
        // Only include therapy types where the patient still has sessions remaining.
        // Exclude 'assessment' — it's handled separately in the Asesmen tab.
        // 'both' packages (therapyType null) are ignored — they don't restrict the therapist list.
        const specificTypes: string[] = Array.from(
          new Set<string>(
            topups
              .filter((t: any) => t.therapyType && t.therapyType !== 'assessment' && (t.remainingSessions ?? 0) > 0)
              .map((t: any) => t.therapyType as string)
          )
        );
        setPatientTherapyTypes(specificTypes);
        const allTypes: string[] = Array.from(
          new Set<string>(
            topups
              .filter((t: any) => t.therapyType && t.therapyType !== 'assessment')
              .map((t: any) => t.therapyType as string)
          )
        );
        setTypeCandidates(allTypes);
      })
      .catch(() => { setPatientTherapyTypes([]); setTypeCandidates([]); });
  }, [form.patientId, isHeroBridge]);

  // Once patient/candidates are known: auto-pick the one unambiguous type
  // silently (keeps the common case simple); clear it when ambiguous (2+
  // candidates) so the admin must choose explicitly instead of the backend
  // guessing "most recently created package".
  useEffect(() => {
    if (isHeroBridge) return;
    if (typeCandidates.length === 1) {
      setForm((f) => (f.therapyType === typeCandidates[0] ? f : { ...f, therapyType: typeCandidates[0] as 'OT' | 'TW' }));
    } else if (typeCandidates.length > 1 && !typeCandidates.includes(form.therapyType as string)) {
      setForm((f) => ({ ...f, therapyType: '' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeCandidates, isHeroBridge]);

  // Fetch assessment package ID when assessment child is selected
  useEffect(() => {
    if (!assessForm.childId) {
      setAssessmentPackageId(null);
      return;
    }
    setAssessmentPackageLoading(true);
    setAssessmentPackageId(null);
    const token = localStorage.getItem('token');
    fetch(`/api/children/${assessForm.childId}/tokens`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const txs: any[] = data.data?.transactions ?? [];
        const assessTx = txs.find(
          (t: any) => t.type === 'topup' && t.therapyType === 'assessment' && (t.remainingSessions ?? 0) > 0
        );
        setAssessmentPackageId(assessTx?._id?.toString() ?? null);
      })
      .catch(() => setAssessmentPackageId(null))
      .finally(() => setAssessmentPackageLoading(false));
  }, [assessForm.childId]);

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

  const heroBridgeDay = dateStrToDayName(heroBridgeDate);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const therapyType = isHeroBridge ? 'HB' : (form.therapyType === 'HB' ? '' : form.therapyType);
      const day = isHeroBridge ? (heroBridgeDay || form.day) : form.day;
      const effectiveFrom = isHeroBridge
        ? mondayOfDateStr(heroBridgeDate)
        : (effectiveChoice === "this" ? thisWeek : nextWeek);
      const therapistName = isHeroBridge ? manualTherapistName.trim() : form.therapistName;
      const therapistId = isHeroBridge ? manualTherapistName.trim() : form.therapistId;
      await onSave({ ...form, day, therapyType, therapistId, therapistName, effectiveFrom });
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
    if (!assessForm.childId || !assessForm.date || !assessmentPackageId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveAssessment!({
        childId: assessForm.childId,
        assessorId: assessForm.assessorId || null,
        date: assessForm.date,
        time: assessForm.time,
        notes: assessForm.notes,
        packageId: assessmentPackageId,
      });
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan asesmen.');
      setSaving(false);
    }
  };

  const assessmentPatients = patients.filter((p) => (p.therapyBalance?.assessment ?? 0) > 0);

  const isValid = isHeroBridge
    ? Boolean(form.patientId && manualTherapistName.trim() && heroBridgeDate && heroBridgeDay)
    : Boolean(
        form.patientId && form.therapistId && form.day &&
        (typeCandidates.length <= 1 || typeCandidates.includes(form.therapyType as string))
      );

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

          {/* Jenis Terapi — Reguler (OT/TW, berbasis paket, berulang tiap minggu) vs Hero Bridge (jadwal satu kali, tanpa paket/token) */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Jenis Terapi</label>
            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsHeroBridge(false)}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
                  !isHeroBridge ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reguler (OT/TW)
              </button>
              <button
                type="button"
                onClick={() => setIsHeroBridge(true)}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${
                  isHeroBridge ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Hero Bridge
              </button>
            </div>
          </div>

          {/* Day/Date + Hour — Reguler: hari berulang. Hero Bridge: tanggal spesifik, satu kali. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                {isHeroBridge ? 'Tanggal' : 'Hari'}
              </label>
              {isHeroBridge ? (
                <input
                  type="date"
                  value={heroBridgeDate}
                  onChange={(e) => setHeroBridgeDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              ) : (
                <select
                  value={form.day}
                  onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{DAY_LABELS[d]}</option>
                  ))}
                </select>
              )}
              {isHeroBridge && heroBridgeDate && !heroBridgeDay && (
                <p className="text-xs text-red-600 mt-1">Pilih tanggal Senin–Sabtu.</p>
              )}
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
          {isHeroBridge && (
            <p className="text-[11px] text-emerald-600 -mt-2">
              Sesi Hero Bridge hanya tampil sekali pada tanggal ini, tidak berulang tiap minggu.
            </p>
          )}

          {/* Patient — Reguler: only those with active package (tokenBalance > 0). Hero Bridge: semua pasien. */}
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
              {(isHeroBridge ? patients : patients.filter(hasSchedulableBalance)).map((p) => (
                <option key={p._id} value={p._id}>
                  {isHeroBridge ? p.name : `${p.name} (${formatTherapyLabel(p)})`}
                </option>
              ))}
            </select>
            {!isHeroBridge && patients.filter(hasSchedulableBalance).length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Semua pasien aktif sudah terjadwal minggu ini.
              </p>
            )}
          </div>

          {/* Jenis Terapi — only shown when the patient has more than one type
              of package (e.g. an OT slot already running + a TW package too),
              so admin picks explicitly instead of the backend guessing which
              package to attach the new slot to. */}
          {!isHeroBridge && form.patientId && typeCandidates.length > 1 && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Jenis Terapi <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {typeCandidates.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, therapyType: type as 'OT' | 'TW' }))}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      form.therapyType === type
                        ? type === 'OT'
                          ? 'bg-blue-100 border-blue-400 text-blue-800'
                          : 'bg-purple-100 border-purple-400 text-purple-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pasien ini punya paket {typeCandidates.join(' dan ')} — pilih paket mana yang dipakai untuk slot ini.
              </p>
            </div>
          )}

          {/* Therapist — Reguler: pilih dari terapis terdaftar, difilter sesuai jenis paket pasien.
              Hero Bridge: isi nama manual, tidak harus terapis yang terdaftar di sistem. */}
          <div>
            <label className={`text-xs font-medium mb-1 flex items-center gap-1.5 ${(isHeroBridge || form.patientId) ? 'text-gray-700' : 'text-gray-400'}`}>
              <StethoscopeIcon className="inline h-3 w-3" />
              Terapis
              {!isHeroBridge && patientTherapyTypes.map((type) => (
                <span key={type} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  type === 'OT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {type}
                </span>
              ))}
            </label>
            {isHeroBridge ? (
              <input
                type="text"
                value={manualTherapistName}
                onChange={(e) => setManualTherapistName(e.target.value)}
                placeholder="Tulis nama terapis/pengisi sesi..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            ) : (
              <>
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
              </>
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

          {/* effectiveFrom choice — hanya untuk slot reguler (OT/TW); Hero Bridge sudah pakai tanggal spesifik di atas */}
          {!isHeroBridge && (
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
          )}
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

            {assessmentPatients.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-700">
                Belum ada pasien dengan paket assessment yang tersedia.
              </div>
            ) : (
              <>
                {/* Patient — only those with assessment remaining */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    <UserIcon className="inline h-3 w-3 mr-1" />
                    Pasien
                  </label>
                  <select
                    value={assessForm.childId}
                    onChange={(e) => setAssessForm((f) => ({ ...f, childId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Pilih pasien...</option>
                    {assessmentPatients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}{p.diagnosis ? ` — ${p.diagnosis.slice(0, 30)}` : ''}
                      </option>
                    ))}
                  </select>
                  {assessForm.childId && assessmentPackageLoading && (
                    <p className="text-xs text-gray-400 mt-1">Memuat info paket...</p>
                  )}
                  {assessForm.childId && !assessmentPackageLoading && !assessmentPackageId && (
                    <p className="text-xs text-red-500 mt-1">Paket assessment tidak ditemukan atau sudah terpakai.</p>
                  )}
                </div>

                {/* Assessor — all therapists, not filtered */}
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
              </>
            )}
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
              disabled={!assessForm.childId || !assessForm.date || !assessmentPackageId || assessmentPackageLoading || saving}
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
// ExtraSessionModal — add a one-off "susulan" (make-up) session mid-package,
// without touching the patient's recurring WeeklySchedule slot(s).
// ---------------------------------------------------------------------------

function ExtraSessionModal({
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

  const eligiblePatients = patients.filter((p) => (p.tokenBalance ?? 0) > 0);
  const selectedPatient = eligiblePatients.find((p) => p._id === selectedPatientId);

  useEffect(() => {
    if (selectedPatient?.assignedTherapistId) {
      setSelectedTherapistId(selectedPatient.assignedTherapistId);
    }
  }, [selectedPatient]);

  const handleSave = async () => {
    if (!selectedPatientId || !date || !selectedTherapistId) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(selectedPatientId, date, hour, selectedTherapistId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menambah sesi susulan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Tambah Sesi Susulan</DialogTitle>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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
            Menambah satu sesi tambahan (mis. mengganti sesi yang bolong) di tengah paket yang sedang berjalan — <strong>tidak mengubah</strong> jadwal rutin mingguan pasien.
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
                Tidak ada pasien dengan paket aktif.
              </p>
            )}
          </div>

          {/* Therapist */}
          {selectedPatientId && (
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                <StethoscopeIcon className="inline h-3 w-3 mr-1" />
                Terapis
              </label>
              <select
                value={selectedTherapistId}
                onChange={(e) => setSelectedTherapistId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Pilih terapis...</option>
                {therapists.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Tanggal Sesi</label>
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
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedPatientId || !date || !selectedTherapistId || saving}
          >
            {saving ? "Menyimpan..." : "Tambah Sesi Susulan"}
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
  const permissions = usePermissions(user?.role ?? "parent");
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
  const therapistColorMap = useMemo(
    () => Object.fromEntries(allTherapists.filter((t) => t.color).map((t) => [t._id, t.color as string])),
    [allTherapists]
  );
  const scheduledPatientIds = useMemo(() => new Set(slots.map((s) => s.patientId)), [slots]);
  const patientsWithActiveTherapySlot = useMemo(
    () => new Set(slots.filter((s) => s.therapyType === 'OT' || s.therapyType === 'TW').map((s) => s.patientId)),
    [slots]
  );
  // Patient is eligible to pick for a new slot if they have an active package
  // (tokens remaining). A package can now span multiple days per week (see
  // "+ Sesi Tambahan"/multi-day scheduling), so a patient who already has a
  // slot is still a valid pick for adding a 2nd/3rd day — no longer capped at
  // "fewer slots than active packages".
  const unscheduledPatients = useMemo(
    () => allPatients.filter((p) => (p.tokenBalance ?? 0) > 0),
    [allPatients]
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

  // Extra/susulan session modal state
  const [showExtraSessionModal, setShowExtraSessionModal] = useState(false);

  // Assessment state
  const [assessments, setAssessments] = useState<AssessmentSlot[]>([]);
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentSlot | null>(null);
  const [assessmentStatusLoading, setAssessmentStatusLoading] = useState(false);
  const [editAssessorId, setEditAssessorId] = useState('');
  const [assessorSaving, setAssessorSaving] = useState(false);

  // Leave set: "therapistId_dateStr" → true (therapist on leave that date)
  const [leaveSet, setLeaveSet] = useState<Set<string>>(new Set());

  // Grid search/filter — allTherapists is already fetched for the slot-creation
  // modal's dropdown; this reuses it as the filter's option list too.
  const [searchTerm, setSearchTerm] = useState("");
  const [therapistFilter, setTherapistFilter] = useState("");

  // Mobile agenda view: which day's slots are shown (defaults to today if within Mon-Sat)
  const [selectedMobileDay, setSelectedMobileDay] = useState<Day>(DAYS[0]);

  const weekDates = getWeekDates(weekStart);
  const todayStr = getTodayStr();

  // Keep the mobile agenda day-picker pointed at today when the visible week changes
  // (e.g. navigating weeks or on first load), falling back to Monday if today is a Sunday.
  useEffect(() => {
    const todayIdx = weekDates.indexOf(todayStr);
    setSelectedMobileDay(todayIdx >= 0 ? DAYS[todayIdx] : DAYS[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

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

  // ---- Fetch therapist leaves for the current week ----

  const fetchLeaves = useCallback(async () => {
    if (!user || !permissions.hasAnyPermission(['leaves:view_all', 'leaves:view_own'])) return;
    try {
      const token = localStorage.getItem('token');
      const weekEnd = addDays(weekStart, 5);
      const res = await fetch(`/api/therapist-leaves?from=${weekStart}&to=${weekEnd}&status=active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const result = await res.json();
      const leaveDates = new Set<string>();
      const weekDatesArr = getWeekDates(weekStart);
      for (const lv of (result.leaves ?? []) as any[]) {
        const startStr = (lv.startDate as string).split('T')[0];
        const endStr   = lv.endDate ? (lv.endDate as string).split('T')[0] : null;
        for (const dateStr of weekDatesArr) {
          if (dateStr >= startStr && (endStr === null || dateStr <= endStr)) {
            leaveDates.add(`${(lv.userId as string).toString()}_${dateStr}`);
          }
        }
      }
      setLeaveSet(leaveDates);
    } catch {
      // silently fail
    }
  }, [user, weekStart, permissions]);

  // ---- Fetch assessments for the current week ----

  const fetchAssessments = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/assessments?week=${weekStart}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setAssessments(result.assessments ?? []);
      } else {
        console.error('[fetchAssessments] status:', res.status, await res.text());
      }
    } catch (err) {
      console.error('[fetchAssessments] error:', err);
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
          color: t.color ?? null,
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
      const res = await fetch("/api/children?limit=100", { headers: { Authorization: `Bearer ${token}` } });
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
      fetchLeaves();
      if (permissions.hasPermission("schedules:manage_all")) fetchDropdownData();
      else fetchPhotoMap();
    }
  }, [user, weekStart, permissions, fetchSlots, fetchAssessments, fetchLeaves, fetchDropdownData, fetchPhotoMap]);

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

  // ---- Extra/susulan session creation ----

  const handleCreateExtraSession = async (childId: string, date: string, hour: number, therapistId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/children/${childId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isExtra: true, date, time: `${String(hour).padStart(2, "0")}:00`, therapistId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Gagal menambah sesi susulan (${res.status})`);
    }
    setShowExtraSessionModal(false);
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
    packageId?: string | null;
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
    slots.filter((s) =>
      s.day === day &&
      s.hour === hour &&
      (!therapistFilter || s.therapistId === therapistFilter) &&
      (!searchTerm.trim() || s.patientName.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    );

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

  // Shared cell body (assessments + slots + add-slot button) for a given day/hour —
  // used by both the desktop grid <td> and the mobile day-agenda view, so the two
  // layouts can never drift out of sync on what they render for the same slot.
  const CellContent = ({ day, hour }: { day: string; hour: number }) => {
    const dayIndex = DAYS.indexOf(day as Day);
    const dateStr = dayIndex >= 0 ? weekDates[dayIndex] : '';
    return (
      <>
        {getAssessmentsForCell(day, hour).map((a) => (
          <AssessmentCard
            key={a._id}
            assessment={a}
            onClick={() => {
              if (permissions.hasPermission('assessments:manage')) {
                setAssessmentDetail(a);
                const aid = a.assessorId;
                setEditAssessorId(aid ? (typeof aid === 'object' ? aid._id : aid) : '');
              }
            }}
          />
        ))}
        {getSlotsForCell(day, hour).map((slot) => (
          <SlotCard
            key={slot._id}
            slot={slot}
            isOwn={user?.role === "therapist" && slot.therapistId === user?._id}
            isParentView={!permissions.hasAnyPermission(['schedules:edit', 'schedules:manage_all'])}
            weekStart={weekStart}
            reportMap={reportMap}
            patientPhotoUrl={patientPhotoMap[slot.patientId] ?? null}
            isTherapistOnLeave={leaveSet.has(`${slot.therapistId}_${dateStr}`)}
            therapistColor={therapistColorMap[slot.therapistId] ?? null}
            onClick={() => {
              if (permissions.hasPermission("schedules:manage_all")) openEditSlot(slot);
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
        {permissions.hasPermission("schedules:manage_all") && (
          <button
            className="w-full h-7 flex items-center justify-center text-gray-300 hover:text-teal-500 hover:bg-teal-50 rounded border border-dashed border-gray-200 hover:border-teal-300 transition-colors"
            onClick={() => openNewSlot(day, hour)}
            title={`Tambah slot ${DAY_LABELS[day as Day]} ${String(hour).padStart(2, "0")}:00`}
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        )}
      </>
    );
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
        {permissions.hasPermission("schedules:manage_all") && (
          <div className="flex items-center gap-2">
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <Button variant="outline" onClick={() => setShowExtraSessionModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Sesi Susulan
              </Button>
            )}
            <Button onClick={() => openNewSlot()}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Tambah Slot
            </Button>
          </div>
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

      {/* Search anak + filter terapis */}
      {permissions.hasAnyPermission(["schedules:view_own", "schedules:manage_all"]) && (
        <div className="flex flex-wrap items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="relative flex-1 min-w-[180px]">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama anak di jadwal..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={therapistFilter}
            onChange={(e) => setTherapistFilter(e.target.value)}
            className="border border-gray-200 rounded-md px-2.5 py-1.5 text-sm text-gray-700"
          >
            <option value="">Semua Terapis</option>
            {allTherapists.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
          {(searchTerm || therapistFilter) && (
            <button
              onClick={() => { setSearchTerm(""); setTherapistFilter(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Therapist legend */}
      {permissions.hasAnyPermission(["schedules:view_own", "schedules:manage_all"]) && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
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
          {allTherapists.some((t) => t.color) && (
            <>
              <span className="w-px h-4 bg-gray-200" />
              <span className="font-medium text-gray-700">Warna Terapis:</span>
              {allTherapists.filter((t) => t.color).map((t) => (
                <span key={t._id} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: t.color ?? undefined }} />
                  {t.name.replace(/,.*/, "")}
                </span>
              ))}
            </>
          )}
        </div>
      )}

      {/* Calendar grid — desktop/tablet: full 7-column table.
          Below md, a 720px-wide table required horizontal scroll with no visual
          hint that it was scrollable, so users thought data was simply missing.
          Replaced below md with a single-day agenda view instead (see below). */}
      <Card className="hidden md:block">
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
                          <CellContent day={day} hour={hour} />
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

      {/* Calendar grid — mobile: one day at a time, stacked vertically (no
          horizontal scroll, nothing hidden). */}
      <div className="md:hidden space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {DAYS.map((day, i) => {
            const dateStr = weekDates[i];
            const isToday = dateStr === todayStr;
            const isSelected = day === selectedMobileDay;
            return (
              <button
                key={day}
                onClick={() => setSelectedMobileDay(day)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  isSelected
                    ? "bg-teal-600 text-white border-teal-600"
                    : isToday
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                <div>{DAY_LABELS[day]}</div>
                <div className={`text-[10px] font-normal mt-0.5 ${isSelected ? "text-teal-100" : "text-gray-400"}`}>
                  {formatShortDate(dateStr)}
                </div>
              </button>
            );
          })}
        </div>

        <Card>
          <CardContent className="p-3 space-y-2">
            {HOURS.map((hour) => (
              <div key={hour} className="flex gap-3 border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                <div className="w-14 shrink-0 pt-1 text-xs font-medium text-gray-500">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <CellContent day={selectedMobileDay} hour={hour} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

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

              {assessmentDetail.status === 'completed' &&
                !assessmentDetail.result?.OT &&
                !assessmentDetail.result?.TW && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                    <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-800">Laporan asesmen belum diisi</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Harap isi hasil asesmen di profil anak.
                      </p>
                      {typeof assessmentDetail.childId === 'object' && (
                        <a
                          href={`/dashboard/children/${assessmentDetail.childId._id}?tab=assessments`}
                          className="mt-1.5 inline-block text-[11px] font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
                        >
                          Buka profil anak →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              {!(assessmentDetail.status === 'completed' && !assessmentDetail.result?.OT && !assessmentDetail.result?.TW) && (
                <p className="text-xs text-gray-400 text-center">
                  Untuk mengisi hasil asesmen, buka profil anak.
                </p>
              )}
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

      {/* Extra/susulan session modal (admin only) */}
      {showExtraSessionModal && (
        <ExtraSessionModal
          patients={allPatients}
          therapists={allTherapists}
          weekStart={weekStart}
          onClose={() => setShowExtraSessionModal(false)}
          onSave={handleCreateExtraSession}
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
          showTabs={permissions.hasPermission("schedules:manage_all")}
          onSaveAssessment={handleCreateAssessment}
          patientsWithActiveSlot={patientsWithActiveTherapySlot}
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
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-teal-800">{rescheduleSlot.patientName}</p>
                  {rescheduleSlot.therapyType && (
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white leading-none">
                      {rescheduleSlot.therapyType}
                    </span>
                  )}
                </div>
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
