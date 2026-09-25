import mongoose from 'mongoose';
import { canActOnOwnRecord } from '@/lib/utils/permissions';

/**
 * Shared "can this user access this report" check, used by every /api/reports/[id]/*
 * route. Previously reimplemented independently (with a since-fixed super_admin
 * omission bug in one copy) in reports/[id]/route.ts, reports/[id]/comments/route.ts,
 * and reports/[id]/media/route.ts — now a single source of truth.
 */
export async function canAccessReport(report: any, user: any): Promise<boolean> {
  if (user.role === 'parent') {
    // Drafts are auto-created as soon as a therapist picks the first media file,
    // so parents only ever see a report once it has been saved as completed.
    if (report.status !== 'completed') return false;
    const Child = mongoose.models.Child ||
      mongoose.model('Child', new mongoose.Schema({ parentId: mongoose.Schema.Types.ObjectId }));
    const child = await Child.findOne({
      _id: report.childId,
      parentId: new mongoose.Types.ObjectId(user.userId),
    }).lean();
    return !!child;
  }
  return canActOnOwnRecord(user.role, user.userId, report.therapistId?.toString(), ['admin', 'super_admin']);
}
