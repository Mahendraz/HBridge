import Session from '@/models/Session';
import TherapistLeave from '@/models/TherapistLeave';

export type LeaveType = 'sakit_izin' | 'inactive';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sakit_izin: 'Sakit/Izin',
  inactive: 'Inaktif',
};

/** Maps the legacy 'cuti' type onto 'sakit_izin'; everything else passes through. */
export function normalizeLeaveType(type: string): LeaveType {
  return type === 'inactive' ? 'inactive' : 'sakit_izin';
}

/**
 * Server-side guard for ADM-4: returns an error message when the therapist is
 * Inaktif on `date`, so no new schedule/session can be assigned to them — the
 * UI pickers hide them too, this covers API calls and drag-drop reassignments.
 */
export async function getInactiveTherapistError(
  therapistId: unknown,
  date: Date
): Promise<string | null> {
  if (!therapistId) return null;
  const leave = await TherapistLeave.findOne({
    userId: therapistId,
    type: 'inactive',
    status: 'active',
    startDate: { $lte: date },
    $or: [{ endDate: null }, { endDate: { $gte: date } }],
  })
    .select('userName')
    .lean<{ userName: string }>();
  if (!leave) return null;
  return `Terapis ${leave.userName} berstatus Inaktif pada tanggal ini, jadi tidak bisa dijadwalkan. Pilih terapis lain.`;
}

export interface LeaveScheduleWarning {
  affectedSlots: number;
  message: string;
}

/**
 * Counts the therapist's sessions still scheduled during [startDate, endDate]
 * (endDate null = open-ended), from today onward. Counts real Session docs —
 * not WeeklySchedule templates, which include superseded versions and would
 * overstate it. Nothing is moved automatically; this only tells the admin how
 * many sessions still need another therapist. Returns null when none.
 */
export async function getLeaveScheduleWarning(
  therapistId: string,
  type: LeaveType,
  startDate: Date,
  endDate: Date | null
): Promise<LeaveScheduleWarning | null> {
  // Session.date is the WIB calendar date stored at UTC midnight.
  const wibNow = new Date(Date.now() + 7 * 3600 * 1000);
  const today = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()));
  const start = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const from = start > today ? start : today;
  const dateRange: Record<string, Date> = { $gte: from };
  if (endDate) dateRange.$lte = endDate;

  const affectedSlots = await Session.countDocuments({
    therapistId,
    status: 'scheduled',
    isActive: true,
    date: dateRange,
  }).catch(() => 0);
  if (affectedSlots === 0) return null;

  return {
    affectedSlots,
    message:
      type === 'inactive'
        ? `Terapis ini masih punya ${affectedSlots} sesi terjadwal. Sesi tersebut disembunyikan dari halaman Jadwal — pindahkan ke terapis lain.`
        : `Terapis ini masih punya ${affectedSlots} sesi terjadwal selama periode Sakit/Izin. Pindahkan ke terapis lain bila perlu.`,
  };
}
