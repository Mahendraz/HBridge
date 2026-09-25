import mongoose from 'mongoose';
import Child from '@/models/Child';
import User from '@/models/User';
import Session from '@/models/Session';
import WeeklySchedule from '@/models/WeeklySchedule';

/**
 * Account deletion (ADM-3). "Hapus" only removes the account: it can't log in
 * any more and drops out of every active list. Past sessions, invoices, token
 * transactions and reports are left as they are, so history and the payment
 * report (SA-4) don't change.
 *
 * Callers are responsible for the permission check — only Super Admin may
 * reach these (directly, or by approving a DeletionRequest).
 */

/**
 * Soft-delete children and take them off the schedule: end their weekly
 * templates as of now and cancel sessions that haven't happened yet.
 * Returns how many children were actually deactivated.
 */
async function deactivateChildren(childIds: string[]): Promise<number> {
  if (childIds.length === 0) return 0;
  const now = new Date();
  // Today's WIB (UTC+7) calendar date as UTC midnight — the format Session.date uses.
  const wibNow = new Date(now.getTime() + 7 * 3600 * 1000);
  const startOfTodayUtc = new Date(Date.UTC(wibNow.getUTCFullYear(), wibNow.getUTCMonth(), wibNow.getUTCDate()));
  const objectIds = childIds.map((id) => new mongoose.Types.ObjectId(id));

  const res = await Child.updateMany(
    { _id: { $in: objectIds }, isActive: true },
    { $set: { isActive: false, therapistId: null } }
  );

  await Promise.all([
    WeeklySchedule.updateMany(
      {
        patientId: { $in: childIds },
        $or: [{ effectiveUntil: null }, { effectiveUntil: { $gt: now } }],
      },
      { $set: { effectiveUntil: now } }
    ),
    Session.updateMany(
      // Session.date is stored at UTC midnight, so compare from the start of
      // today — otherwise later sessions on the day of deletion stay scheduled.
      { childId: { $in: objectIds }, status: 'scheduled', date: { $gte: startOfTodayUtc } },
      { $set: { status: 'cancelled' } }
    ),
  ]);

  return res.modifiedCount;
}

export async function deleteChildAccount(childId: string): Promise<{ deleted: boolean }> {
  const count = await deactivateChildren([childId]);
  return { deleted: count > 0 };
}

/** Deletes the parent account together with all of its children. */
export async function deleteParentAccount(
  parentId: string
): Promise<{ deleted: boolean; childrenDeleted: number }> {
  const parent = await User.findOne({ _id: parentId, role: 'parent', isActive: true });
  if (!parent) return { deleted: false, childrenDeleted: 0 };

  const children = await Child.find({ parentId: parent._id, isActive: true }).select('_id').lean();
  const childrenDeleted = await deactivateChildren(children.map((c) => c._id.toString()));

  parent.isActive = false;
  await parent.save();

  return { deleted: true, childrenDeleted };
}

/**
 * Looks up an active parent/child for a deletion request. Returns the display
 * name plus, for a parent, the names of the children that go with it.
 */
export async function findDeletionTarget(
  targetType: 'parent' | 'child',
  targetId: string
): Promise<{ name: string; relatedChildNames: string[] } | null> {
  if (targetType === 'child') {
    const child = await Child.findOne({ _id: targetId, isActive: true }).select('name').lean<{ name: string }>();
    return child ? { name: child.name, relatedChildNames: [] } : null;
  }

  const parent = await User.findOne({ _id: targetId, role: 'parent', isActive: true }).select('name').lean<{ name: string }>();
  if (!parent) return null;
  const children = await Child.find({ parentId: targetId, isActive: true }).select('name').lean<{ name: string }[]>();
  return { name: parent.name, relatedChildNames: children.map((c) => c.name) };
}
