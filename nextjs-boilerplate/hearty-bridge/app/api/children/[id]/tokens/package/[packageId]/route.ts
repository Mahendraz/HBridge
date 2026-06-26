import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withErrorHandling, SuccessResponse, ErrorResponse } from '@/lib/utils/error-handler';
import connectToDatabase from '@/lib/db/mongodb';
import Child from '@/models/Child';
import Session from '@/models/Session';
import WeeklySchedule from '@/models/WeeklySchedule';
import TokenTransaction from '@/models/TokenTransaction';
import mongoose from 'mongoose';

const DAY_MAP: Record<string, number> = {
  senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6
};

function getIds(req: NextRequest): { childId: string; packageId: string } {
  const parts = new URL(req.url).pathname.split('/');
  const pkgIdx = parts.indexOf('package');
  return {
    childId: pkgIdx > 0 ? parts[pkgIdx - 2] : '',
    packageId: pkgIdx > 0 ? parts[pkgIdx + 1] : '',
  };
}

function nextOccurrence(from: Date, targetDay: number): Date {
  const d = new Date(from);
  d.setUTCHours(0, 0, 0, 0);
  const current = d.getUTCDay();
  const diff = (targetDay - current + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/**
 * PATCH /api/children/[id]/tokens/package/[packageId]
 * Adjust the session count of an active package.
 * Body: { adjustment: number (signed integer), note?: string }
 *
 * Positive adjustment: adds sessions (generates new Session records)
 * Negative adjustment: removes sessions (soft-deletes last N unstarted sessions)
 */
export const PATCH = withAdminAuth(
  withErrorHandling(async (req: NextRequest, user: any) => {
    const { childId, packageId } = getIds(req);

    if (!mongoose.isValidObjectId(childId) || !mongoose.isValidObjectId(packageId)) {
      return NextResponse.json(ErrorResponse.badRequest('Invalid ID'), { status: 400 });
    }

    const body = await req.json();
    const adjustment = Number(body.adjustment);
    const note = (body.note as string | undefined)?.trim() || '';

    if (!Number.isInteger(adjustment) || adjustment === 0) {
      return NextResponse.json(
        ErrorResponse.badRequest('adjustment must be a non-zero integer'),
        { status: 400 }
      );
    }

    await connectToDatabase();

    const child = await Child.findOne({ _id: childId, isActive: true });
    if (!child) {
      return NextResponse.json(ErrorResponse.notFound('Child not found'), { status: 404 });
    }

    const originalTx = await TokenTransaction.findOne({
      _id: packageId,
      childId: new mongoose.Types.ObjectId(childId),
      type: 'topup',
      packageType: { $ne: null },
    });
    if (!originalTx) {
      return NextResponse.json(ErrorResponse.notFound('Package not found'), { status: 404 });
    }

    const completedCount = await Session.countDocuments({
      packageId: new mongoose.Types.ObjectId(packageId),
      status: 'completed',
      isActive: true,
    });

    const currentTotal = await Session.countDocuments({
      packageId: new mongoose.Types.ObjectId(packageId),
      isActive: true,
    });

    const newTotal = currentTotal + adjustment;

    if (newTotal < completedCount) {
      return NextResponse.json(
        ErrorResponse.badRequest(
          `Tidak dapat mengurangi. Sudah ${completedCount} sesi selesai.`
        ),
        { status: 400 }
      );
    }
    if (newTotal < 1) {
      return NextResponse.json(
        ErrorResponse.badRequest('Total sesi tidak boleh kurang dari 1'),
        { status: 400 }
      );
    }

    const balanceBefore = child.tokenBalance ?? 0;
    const balanceAfter = balanceBefore + adjustment;

    if (balanceAfter < 0) {
      return NextResponse.json(
        ErrorResponse.badRequest('Saldo token tidak mencukupi untuk pengurangan ini'),
        { status: 400 }
      );
    }

    if (adjustment > 0) {
      // Find the last session date for this package to continue from there
      const lastSession = await Session.findOne({
        packageId: new mongoose.Types.ObjectId(packageId),
        isActive: true,
      })
        .sort({ sessionNumber: -1 })
        .lean();

      const slot = await WeeklySchedule.findOne({ patientId: childId, packageId }).lean();
      const targetDay = slot ? DAY_MAP[slot.day] : 1;

      let cursor = lastSession ? new Date((lastSession as any).date) : new Date();
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);

      const newDates: Date[] = [];
      for (let i = 0; i < adjustment; i++) {
        cursor = nextOccurrence(cursor, targetDay);
        newDates.push(new Date(cursor));
        cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      }

      const startNumber = currentTotal + 1;
      const therapistId = lastSession
        ? (lastSession as any).therapistId
        : new mongoose.Types.ObjectId(slot?.therapistId || '');

      const newSessions = newDates.map((date, idx) => ({
        childId: new mongoose.Types.ObjectId(childId),
        therapistId,
        date,
        time: slot ? `${String(slot.hour).padStart(2, '0')}:00` : '09:00',
        duration: 60,
        type: 'in-person' as const,
        status: 'scheduled' as const,
        packageId: new mongoose.Types.ObjectId(packageId),
        sessionNumber: startNumber + idx,
        totalSessions: newTotal,
        isActive: true,
      }));

      await Session.insertMany(newSessions);

      // Update totalSessions on all sessions of this package
      await Session.updateMany(
        { packageId: new mongoose.Types.ObjectId(packageId), isActive: true },
        { $set: { totalSessions: newTotal } }
      );

      // Update WeeklySchedule
      const lastDate = newDates[newDates.length - 1];
      if (slot) {
        await WeeklySchedule.findByIdAndUpdate(slot._id, {
          $set: { totalSessions: newTotal, effectiveUntil: lastDate },
        });
        child.tokenExpiry = lastDate;
      }
    } else {
      // Remove the last |adjustment| scheduled sessions
      const toRemove = Math.abs(adjustment);
      const sessionsToDelete = await Session.find({
        packageId: new mongoose.Types.ObjectId(packageId),
        status: 'scheduled',
        isActive: true,
      })
        .sort({ sessionNumber: -1 })
        .limit(toRemove)
        .lean();

      if (sessionsToDelete.length < toRemove) {
        return NextResponse.json(
          ErrorResponse.badRequest(
            `Hanya ada ${sessionsToDelete.length} sesi terjadwal yang bisa dihapus`
          ),
          { status: 400 }
        );
      }

      const ids = sessionsToDelete.map((s: any) => s._id);
      await Session.updateMany({ _id: { $in: ids } }, { $set: { isActive: false } });

      // Update totalSessions on remaining sessions
      await Session.updateMany(
        { packageId: new mongoose.Types.ObjectId(packageId), isActive: true },
        { $set: { totalSessions: newTotal } }
      );

      // Update WeeklySchedule effectiveUntil to new last session date
      const newLastSession = await Session.findOne({
        packageId: new mongoose.Types.ObjectId(packageId),
        isActive: true,
      })
        .sort({ sessionNumber: -1 })
        .lean();

      const slot = await WeeklySchedule.findOne({ patientId: childId, packageId }).lean();
      if (slot && newLastSession) {
        await WeeklySchedule.findByIdAndUpdate(slot._id, {
          $set: { totalSessions: newTotal, effectiveUntil: (newLastSession as any).date },
        });
        child.tokenExpiry = (newLastSession as any).date;
      }
    }

    child.tokenBalance = balanceAfter;
    await child.save();

    const txNote = note || `Penyesuaian paket: ${adjustment > 0 ? '+' : ''}${adjustment} sesi`;
    await TokenTransaction.create({
      childId: new mongoose.Types.ObjectId(childId),
      childName: child.name,
      adminId: new mongoose.Types.ObjectId(user.userId),
      adminName: user.name || '',
      type: adjustment > 0 ? 'topup' : 'deduct',
      packageType: null,
      amount: Math.abs(adjustment),
      balanceBefore,
      balanceAfter,
      note: txNote,
    });

    return NextResponse.json({
      success: true,
      data: {
        newBalance: balanceAfter,
        newTotal,
        adjustment,
      },
    });
  })
);
