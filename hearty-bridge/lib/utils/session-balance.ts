import mongoose from 'mongoose';
import TokenTransaction from '@/models/TokenTransaction';
import Invoice from '@/models/Invoice';
import Session from '@/models/Session';
import WeeklySchedule from '@/models/WeeklySchedule';
import User from '@/models/User';

/**
 * Single source of truth for "sisa sesi" (remaining therapy sessions).
 *
 * Counted per package (a topup TokenTransaction), then summed per program:
 *   - used      = completed, active Session docs linked to the package
 *   - invoice lunas (or no invoice at all — legacy packages) → sisa = total − used
 *   - invoice belum lunas (unpaid / overdue)                 → sisa = −used
 *
 * The second rule is the "kasbon" case: sessions already ran on a package that
 * hasn't been paid yet, so the balance goes negative and flags the debt on both
 * the parent and admin side. Once the invoice is paid the full package counts
 * and the minus is absorbed (10 sesi, 3 terpakai: −3 → 7).
 *
 * Deliberately NOT the same thing as `therapyBalance` / `remainingSessions`
 * elsewhere — those mean "sessions not yet placed on the calendar" and drive
 * scheduling eligibility. Child.tokenBalance is also not used here.
 *
 * Assessment packages are excluded: they don't produce Session records.
 */

export type ProgramType = 'OT' | 'TW' | 'both';

export const PROGRAM_LABELS: Record<ProgramType, string> = {
  OT: 'OT',
  TW: 'TW',
  both: 'OT & TW',
};

export interface PackageBalance {
  packageTxId: string;
  packageName: string;
  therapyType: ProgramType;
  total: number;
  used: number;
  remaining: number;
  isPaid: boolean;
  invoiceStatus: 'unpaid' | 'paid' | 'overdue' | null;
  invoiceNumber: string | null;
  purchasedAt: string | null;
}

export interface ProgramBalance {
  therapyType: ProgramType;
  label: string;
  total: number;
  used: number;
  remaining: number;
  hasUnpaid: boolean;
}

export interface ChildSessionBalance {
  childId: string;
  remaining: number;
  used: number;
  total: number;
  hasUnpaid: boolean;
  programs: ProgramBalance[];
  packages: PackageBalance[];
}

const PROGRAM_ORDER: ProgramType[] = ['OT', 'TW', 'both'];

export function computePackageRemaining(total: number, used: number, isPaid: boolean): number {
  return isPaid ? total - used : -used;
}

function toProgramType(therapyType: string | null | undefined): ProgramType {
  return therapyType === 'OT' || therapyType === 'TW' ? therapyType : 'both';
}

function toOids(ids: Array<string | mongoose.Types.ObjectId>): mongoose.Types.ObjectId[] {
  return ids
    .map((id) => id.toString())
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

type Oid = mongoose.Types.ObjectId;

interface TopupLean {
  _id: Oid;
  childId: Oid;
  packageType: string | null;
  therapyType: string | null;
  amount: number;
  createdAt?: Date;
}

interface InvoiceLean {
  packageTransactionId?: Oid;
  status: 'unpaid' | 'paid' | 'overdue';
  invoiceNumber: string;
}

interface SlotLean {
  patientId: string;
  therapistId?: string;
  therapistName?: string;
  therapyType?: string | null;
  packageId?: string | null;
  effectiveUntil?: Date | null;
}

export function emptySessionBalance(childId: string): ChildSessionBalance {
  return { childId, remaining: 0, used: 0, total: 0, hasUnpaid: false, programs: [], packages: [] };
}

/**
 * Remaining sessions for each child, keyed by child id (hex string). Every
 * requested child gets an entry (empty when it has no therapy package).
 */
export async function getSessionBalances(
  childIds: Array<string | mongoose.Types.ObjectId>
): Promise<Map<string, ChildSessionBalance>> {
  const result = new Map<string, ChildSessionBalance>();
  const childOids = toOids(childIds);
  for (const oid of childOids) result.set(oid.toString(), emptySessionBalance(oid.toString()));
  if (childOids.length === 0) return result;

  const topups = await TokenTransaction.find({
    childId: { $in: childOids },
    type: 'topup',
    packageType: { $ne: null },
    therapyType: { $ne: 'assessment' },
  })
    .sort({ createdAt: 1 })
    .select('_id childId packageType therapyType amount createdAt')
    .lean<TopupLean[]>();

  if (topups.length === 0) return result;

  const txOids = topups.map((t) => t._id);

  const [invoices, usedAgg] = await Promise.all([
    Invoice.find({ packageTransactionId: { $in: txOids }, isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .select('packageTransactionId status invoiceNumber')
      .lean<InvoiceLean[]>(),
    Session.aggregate<{ _id: Oid; count: number }>([
      { $match: { packageId: { $in: txOids }, status: 'completed', isActive: true } },
      { $group: { _id: '$packageId', count: { $sum: 1 } } },
    ]),
  ]);

  // Latest active invoice per package wins (sorted newest first above).
  const invoiceByTx = new Map<string, InvoiceLean>();
  for (const inv of invoices) {
    const key = inv.packageTransactionId?.toString();
    if (key && !invoiceByTx.has(key)) invoiceByTx.set(key, inv);
  }
  const usedByTx = new Map<string, number>(
    usedAgg.map((r) => [r._id.toString(), r.count])
  );

  for (const tx of topups) {
    const childId = tx.childId.toString();
    const txId = tx._id.toString();
    const inv = invoiceByTx.get(txId) ?? null;
    const isPaid = inv ? inv.status === 'paid' : true;
    const total = tx.amount ?? 0;
    const used = usedByTx.get(txId) ?? 0;

    const balance = result.get(childId) ?? emptySessionBalance(childId);
    balance.packages.push({
      packageTxId: txId,
      packageName: tx.packageType ?? 'Paket',
      therapyType: toProgramType(tx.therapyType),
      total,
      used,
      remaining: computePackageRemaining(total, used, isPaid),
      isPaid,
      invoiceStatus: inv?.status ?? null,
      invoiceNumber: inv?.invoiceNumber ?? null,
      purchasedAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : null,
    });
    result.set(childId, balance);
  }

  for (const balance of result.values()) {
    const byProgram = new Map<ProgramType, ProgramBalance>();
    for (const pkg of balance.packages) {
      const prog = byProgram.get(pkg.therapyType) ?? {
        therapyType: pkg.therapyType,
        label: PROGRAM_LABELS[pkg.therapyType],
        total: 0,
        used: 0,
        remaining: 0,
        hasUnpaid: false,
      };
      prog.total += pkg.total;
      prog.used += pkg.used;
      prog.remaining += pkg.remaining;
      prog.hasUnpaid = prog.hasUnpaid || !pkg.isPaid;
      byProgram.set(pkg.therapyType, prog);
    }
    balance.programs = PROGRAM_ORDER.filter((p) => byProgram.has(p)).map((p) => byProgram.get(p)!);
    balance.remaining = balance.programs.reduce((s, p) => s + p.remaining, 0);
    balance.used = balance.programs.reduce((s, p) => s + p.used, 0);
    balance.total = balance.programs.reduce((s, p) => s + p.total, 0);
    balance.hasUnpaid = balance.programs.some((p) => p.hasUnpaid);
  }

  return result;
}

export interface ProgramTherapists {
  therapyType: 'OT' | 'TW' | 'HB' | 'both';
  label: string;
  therapists: Array<{ id: string; name: string }>;
}

const THERAPIST_PROGRAM_ORDER: ProgramTherapists['therapyType'][] = ['OT', 'TW', 'HB', 'both'];
const THERAPIST_PROGRAM_LABELS: Record<ProgramTherapists['therapyType'], string> = {
  ...PROGRAM_LABELS,
  HB: 'HB',
};

/**
 * Therapists handling each program for each child, from the WeeklySchedule
 * slots (that's where therapist assignment actually lives — Child.therapistId
 * is often empty). Per program, slots whose package already ended (effectiveUntil
 * in the past) are ignored when that program has a current slot; otherwise they
 * still count, so a program between slots still shows who handles it.
 */
export async function getTherapistsByProgram(
  childIds: Array<string | mongoose.Types.ObjectId>
): Promise<Map<string, ProgramTherapists[]>> {
  const result = new Map<string, ProgramTherapists[]>();
  const ids = childIds.map((id) => id.toString());
  if (ids.length === 0) return result;

  const slots = await WeeklySchedule.find({ patientId: { $in: ids } })
    .select('patientId therapistId therapistName therapyType packageId effectiveUntil')
    .lean<SlotLean[]>();
  if (slots.length === 0) return result;

  // Slots created from an 'OT & TW' package can have a null therapyType — fall
  // back to the package's own type when it has one.
  const pkgOids = toOids(
    [...new Set(slots.map((s) => s.packageId).filter((id): id is string => !!id))]
  );
  const pkgTypeMap = new Map<string, string>();
  if (pkgOids.length > 0) {
    const txs = await TokenTransaction.find({ _id: { $in: pkgOids } })
      .select('_id therapyType')
      .lean<Array<{ _id: Oid; therapyType: string | null }>>();
    for (const tx of txs) {
      if (tx.therapyType) pkgTypeMap.set(tx._id.toString(), tx.therapyType);
    }
  }

  // Current names from User, falling back to the name denormalized on the slot.
  const therapistOids = toOids(
    [...new Set(slots.map((s) => s.therapistId).filter((id): id is string => !!id))]
  );
  const nameById = new Map<string, string>();
  if (therapistOids.length > 0) {
    const users = await User.find({ _id: { $in: therapistOids } })
      .select('_id name')
      .lean<Array<{ _id: Oid; name: string }>>();
    for (const u of users) nameById.set(u._id.toString(), u.name);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slotsByChild = new Map<string, SlotLean[]>();
  for (const s of slots) {
    const list = slotsByChild.get(s.patientId) ?? [];
    list.push(s);
    slotsByChild.set(s.patientId, list);
  }

  for (const [childId, childSlots] of slotsByChild) {
    // therapist id → name, split into current vs ended slots per program
    const current = new Map<ProgramTherapists['therapyType'], Map<string, string>>();
    const ended = new Map<ProgramTherapists['therapyType'], Map<string, string>>();
    for (const s of childSlots) {
      const rawType = s.therapyType ?? (s.packageId ? pkgTypeMap.get(s.packageId) : null);
      const type: ProgramTherapists['therapyType'] =
        rawType === 'OT' || rawType === 'TW' || rawType === 'HB' ? rawType : 'both';
      const tid = s.therapistId?.toString() ?? '';
      const name = nameById.get(tid) ?? s.therapistName;
      if (!tid || !name) continue;
      const bucket = !s.effectiveUntil || new Date(s.effectiveUntil) >= today ? current : ended;
      const therapists = bucket.get(type) ?? new Map<string, string>();
      therapists.set(tid, name);
      bucket.set(type, therapists);
    }
    const byProgram = new Map(ended);
    for (const [type, therapists] of current) byProgram.set(type, therapists);

    result.set(
      childId,
      THERAPIST_PROGRAM_ORDER.filter((t) => byProgram.has(t)).map((t) => ({
        therapyType: t,
        label: THERAPIST_PROGRAM_LABELS[t],
        therapists: [...byProgram.get(t)!.entries()].map(([id, name]) => ({ id, name })),
      }))
    );
  }

  return result;
}
