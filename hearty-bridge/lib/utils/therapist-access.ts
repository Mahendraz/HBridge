import mongoose from 'mongoose';
import WeeklySchedule from '@/models/WeeklySchedule';
import Session from '@/models/Session';

/**
 * Whether a child is one of this therapist's patients.
 *
 * Assignment lives in WeeklySchedule (Child.therapistId is never populated),
 * so checks against Child.therapistId always fell through and let every
 * therapist reach every child. This is the one place that answers the
 * question: a schedule slot with the child — the same rule GET /api/children
 * uses for the therapist's list — or a one-off Session with them.
 */
export async function therapistHasChild(therapistId: string, childId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(childId) || !mongoose.Types.ObjectId.isValid(therapistId)) {
    return false;
  }

  const slot = await WeeklySchedule.exists({ therapistId, patientId: childId });
  if (slot) return true;

  const session = await Session.exists({
    therapistId: new mongoose.Types.ObjectId(therapistId),
    childId: new mongoose.Types.ObjectId(childId),
  });
  return !!session;
}

/** Ids of every child the therapist has a schedule slot or session with. */
export async function therapistChildIds(therapistId: string): Promise<string[]> {
  const [slotIds, sessionIds] = await Promise.all([
    WeeklySchedule.distinct('patientId', { therapistId }),
    mongoose.Types.ObjectId.isValid(therapistId)
      ? Session.distinct('childId', { therapistId: new mongoose.Types.ObjectId(therapistId) })
      : Promise.resolve([]),
  ]);
  return [...new Set([...slotIds, ...sessionIds].map((id) => String(id)))];
}
