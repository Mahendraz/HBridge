import mongoose from 'mongoose';
import Package from '@/models/Package';
import TokenTransaction from '@/models/TokenTransaction';
import Child from '@/models/Child';
import Session from '@/models/Session';
import { regeneratePackageSchedule } from '@/lib/utils/package-schedule';

/**
 * Switch an unpaid invoice to another package (ADM-2). Price and session count
 * always come from the Package — admin only picks which one. Everything that
 * hangs off the invoice follows along:
 *   - the package TokenTransaction (sessions, prices, name, therapy type)
 *   - Child.tokenBalance (by the difference in sessions)
 *   - the package's schedule: surplus future sessions are dropped, missing
 *     ones generated on the linked weekly slots (regeneratePackageSchedule)
 *
 * Returns the fields to $set on the invoice, or an error message.
 */
export async function applyInvoicePackageChange(
  invoice: {
    childId: mongoose.Types.ObjectId;
    packageTransactionId: mongoose.Types.ObjectId;
    therapyType: string;
    discountAmount?: number;
  },
  packageId: string
): Promise<{ update: Record<string, unknown> } | { error: string }> {
  if (!mongoose.isValidObjectId(packageId)) return { error: 'Paket tidak valid' };

  const pkg = await Package.findById(packageId).lean<{
    _id: mongoose.Types.ObjectId;
    name: string;
    sessions: number;
    price: number;
    therapyType: 'OT' | 'TW' | 'both' | 'assessment';
    isActive: boolean;
  }>();
  if (!pkg) return { error: 'Paket tidak ditemukan' };
  if (!pkg.isActive) return { error: 'Paket ini sudah tidak aktif' };

  // Assessment and therapy packages are tracked differently (Assessment vs
  // Session docs), so an invoice can't jump between the two kinds.
  if ((invoice.therapyType === 'assessment') !== (pkg.therapyType === 'assessment')) {
    return { error: 'Paket asesmen hanya bisa diganti dengan paket asesmen lain, begitu juga paket terapi' };
  }

  const tx = await TokenTransaction.findById(invoice.packageTransactionId);
  if (!tx) return { error: 'Transaksi paket untuk invoice ini tidak ditemukan' };

  const oldSessions = tx.amount ?? 0;
  const newSessions = pkg.sessions;

  // Sessions that already happened (completed / no-show / cancelled) can't be
  // undone, so the new package must at least cover them.
  const regularFilter = { sessionCategory: { $ne: 'extra' as const } };
  const pastCount = await Session.countDocuments({
    packageId: tx._id,
    isActive: true,
    status: { $ne: 'scheduled' },
    ...regularFilter,
  });
  if (newSessions < pastCount) {
    return { error: `Paket ini hanya ${newSessions} sesi, padahal sudah ${pastCount} sesi berjalan di paket sekarang` };
  }

  const discount = Math.min(Math.max(0, invoice.discountAmount ?? 0), pkg.price);
  const finalPrice = pkg.price - discount;

  tx.packageType = pkg.name;
  tx.packageId = pkg._id;
  tx.therapyType = pkg.therapyType === 'both' ? null : pkg.therapyType;
  tx.amount = newSessions;
  tx.originalPrice = pkg.price;
  tx.discountAmount = discount;
  tx.finalPrice = finalPrice;
  tx.balanceAfter = (tx.balanceBefore ?? 0) + newSessions;
  tx.note = `Paket ${pkg.name} (${newSessions} sesi)${discount > 0 ? ` - Diskon Rp ${discount.toLocaleString('id-ID')}` : ''}`;
  await tx.save();

  const delta = newSessions - oldSessions;
  if (delta !== 0) {
    const child = await Child.findById(invoice.childId).select('tokenBalance');
    if (child) {
      child.tokenBalance = Math.max(0, (child.tokenBalance ?? 0) + delta);
      await child.save();
    }

    if (pkg.therapyType !== 'assessment') {
      if (delta < 0) {
        // regeneratePackageSchedule only ever adds sessions, so drop the
        // surplus future ones (latest first) before it recomputes.
        const regularCount = await Session.countDocuments({ packageId: tx._id, isActive: true, ...regularFilter });
        const surplus = regularCount - newSessions;
        if (surplus > 0) {
          const toDelete = await Session.find({ packageId: tx._id, isActive: true, status: 'scheduled', ...regularFilter })
            .sort({ date: -1 })
            .limit(surplus)
            .select('_id')
            .lean();
          await Session.deleteMany({ _id: { $in: toDelete.map((s) => s._id) } });
        }
      }
      await regeneratePackageSchedule(invoice.childId.toString(), tx._id as mongoose.Types.ObjectId);
    }
  }

  return {
    update: {
      packageId: pkg._id,
      packageType: pkg.name,
      therapyType: pkg.therapyType,
      sessions: newSessions,
      originalAmount: pkg.price,
      discountAmount: discount,
      amount: finalPrice,
    },
  };
}
