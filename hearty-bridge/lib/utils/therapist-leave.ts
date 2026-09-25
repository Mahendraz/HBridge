import WeeklySchedule from '@/models/WeeklySchedule';

export type LeaveType = 'sakit_izin' | 'inactive';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sakit_izin: 'Sakit/Izin',
  inactive: 'Inaktif',
};

/** Maps the legacy 'cuti' type onto 'sakit_izin'; everything else passes through. */
export function normalizeLeaveType(type: string): LeaveType {
  return type === 'inactive' ? 'inactive' : 'sakit_izin';
}

export interface LeaveScheduleWarning {
  affectedSlots: number;
  message: string;
}

/**
 * Counts the therapist's recurring schedule slots that are still in effect
 * during [startDate, endDate] (endDate null = open-ended). Slots are never
 * moved automatically — this only tells the admin how many still need to be
 * reassigned to another therapist. Returns null when nothing is affected.
 */
export async function getLeaveScheduleWarning(
  therapistId: string,
  type: LeaveType,
  startDate: Date,
  endDate: Date | null
): Promise<LeaveScheduleWarning | null> {
  const query: Record<string, unknown> = {
    therapistId,
    $and: [
      { $or: [{ effectiveUntil: null }, { effectiveUntil: { $gte: startDate } }] },
      ...(endDate ? [{ $or: [{ effectiveFrom: null }, { effectiveFrom: { $lte: endDate } }] }] : []),
    ],
  };

  const affectedSlots = await WeeklySchedule.countDocuments(query).catch(() => 0);
  if (affectedSlots === 0) return null;

  return {
    affectedSlots,
    message:
      type === 'inactive'
        ? `Terapis ini masih punya ${affectedSlots} jadwal. Jadwal tersebut disembunyikan dari halaman Jadwal — pindahkan ke terapis lain.`
        : `Terapis ini masih punya ${affectedSlots} jadwal selama periode Sakit/Izin. Pindahkan ke terapis lain bila perlu.`,
  };
}
