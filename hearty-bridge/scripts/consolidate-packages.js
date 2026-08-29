/**
 * For every child with more than one real (non-orphan) package of the SAME
 * therapy type, keep only one — the one with the most completed sessions
 * (most real progress), tiebreak by more total sessions, then earliest
 * createdAt — and delete the rest along with their linked WeeklySchedule
 * slot(s) and Session records. OT and TW packages are independent groups
 * (a child can keep one of each). Assessment packages are left untouched.
 *
 * Recomputes each affected child's tokenBalance afterward as
 * sum(topup amounts) - sum(deduct amounts) over what remains, so it stays
 * consistent with the deletions.
 *
 * Run with: node scripts/consolidate-packages.js
 * Pass --dry-run to preview without writing.
 */
const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
const isDryRun = process.argv.includes('--dry-run');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const pkgs = await db.collection('token_transactions')
    .find({ type: 'topup', packageType: { $ne: null }, therapyType: { $ne: 'assessment' } })
    .toArray();

  // Attach effective therapy type (prefer linked slot's therapyType, fall back
  // to the package's own field) and completed-session count.
  const enriched = [];
  for (const p of pkgs) {
    const slots = await db.collection('weeklyschedules').find({ packageId: p._id.toString() }).toArray();
    const slotType = slots.find(s => s.therapyType)?.therapyType ?? null;
    const effectiveType = slotType ?? p.therapyType ?? null;
    if (!effectiveType) continue; // can't group without a type — leave untouched

    const completed = await db.collection('sessions').countDocuments({ packageId: p._id, status: 'completed' });
    const total = await db.collection('sessions').countDocuments({ packageId: p._id });
    enriched.push({ pkg: p, slots, effectiveType, completed, total });
  }

  const byChildType = new Map();
  for (const e of enriched) {
    const key = `${e.pkg.childId}_${e.effectiveType}`;
    if (!byChildType.has(key)) byChildType.set(key, []);
    byChildType.get(key).push(e);
  }

  const toDeletePkgIds = [];
  const toDeleteSlotIds = [];
  const affectedChildIds = new Set();

  console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Consolidation plan:\n`);

  for (const [key, group] of byChildType.entries()) {
    if (group.length < 2) continue;
    const [childId, type] = key.split('_');
    const child = await db.collection('children').findOne({ _id: new mongoose.Types.ObjectId(childId) });

    group.sort((a, b) =>
      b.completed - a.completed ||
      b.total - a.total ||
      new Date(a.pkg.createdAt) - new Date(b.pkg.createdAt)
    );
    const [keep, ...drop] = group;

    console.log(`${child?.name ?? '(unknown)'} — ${type}`);
    console.log(`  KEEP [${keep.pkg._id}] ${keep.pkg.packageType} completed=${keep.completed}/${keep.total} slots=${keep.slots.map(s => `${s.day} ${s.hour}:00`).join(', ')}`);
    for (const d of drop) {
      console.log(`  DROP [${d.pkg._id}] ${d.pkg.packageType} completed=${d.completed}/${d.total} slots=${d.slots.map(s => `${s.day} ${s.hour}:00`).join(', ')}`);
      toDeletePkgIds.push(d.pkg._id);
      toDeleteSlotIds.push(...d.slots.map(s => s._id));
    }
    affectedChildIds.add(childId);
    console.log();
  }

  console.log(`Total: ${toDeletePkgIds.length} packages, ${toDeleteSlotIds.length} slots to delete across ${affectedChildIds.size} children.\n`);

  if (isDryRun) {
    console.log('[DRY RUN] Nothing written. Run without --dry-run to apply.');
    await mongoose.disconnect();
    return;
  }

  if (toDeletePkgIds.length > 0) {
    await db.collection('sessions').deleteMany({ packageId: { $in: toDeletePkgIds } });
    await db.collection('weeklyschedules').deleteMany({ _id: { $in: toDeleteSlotIds } });
    await db.collection('token_transactions').deleteMany({ _id: { $in: toDeletePkgIds } });
  }

  // Recompute tokenBalance for every affected child from what remains.
  for (const childId of affectedChildIds) {
    const oid = new mongoose.Types.ObjectId(childId);
    const remaining = await db.collection('token_transactions').find({ childId: oid }).toArray();
    const balance = remaining.reduce((sum, t) => {
      if (t.type === 'topup') return sum + (t.amount ?? 0);
      if (t.type === 'deduct') return sum - (t.amount ?? 0);
      return sum;
    }, 0);
    await db.collection('children').updateOne({ _id: oid }, { $set: { tokenBalance: balance } });
    console.log(`  tokenBalance recomputed for ${childId}: ${balance}`);
  }

  console.log(`\n✓ Deleted ${toDeletePkgIds.length} packages, ${toDeleteSlotIds.length} slots, and their sessions.`);

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
