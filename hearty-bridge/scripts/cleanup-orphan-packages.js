/**
 * Delete TokenTransaction "topup" packages that have zero Session documents
 * AND are not linked to any WeeklySchedule slot — i.e. genuinely unused,
 * created (likely during manual testing) but never actually scheduled.
 *
 * Run with: node scripts/cleanup-orphan-packages.js
 * Pass --dry-run to preview without deleting.
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
    .find({ type: 'topup', packageType: { $ne: null } })
    .toArray();

  const toDelete = [];
  for (const p of pkgs) {
    const sessionCount = await db.collection('sessions').countDocuments({ packageId: p._id });
    const slotCount = await db.collection('weeklyschedules').countDocuments({ packageId: p._id.toString() });
    if (sessionCount === 0 && slotCount === 0) {
      const child = await db.collection('children').findOne({ _id: p.childId });
      toDelete.push({ pkg: p, childName: child?.name ?? '(unknown)' });
    }
  }

  console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Found ${toDelete.length} orphan packages (0 sessions, 0 linked slots):\n`);
  for (const { pkg, childName } of toDelete) {
    console.log(`  ${childName} | [${pkg._id}] ${pkg.packageType} ${pkg.therapyType ?? 'no-type'} amount=${pkg.amount} createdAt=${pkg.createdAt?.toISOString?.().slice(0,10)}`);
  }

  if (!isDryRun && toDelete.length > 0) {
    const ids = toDelete.map(({ pkg }) => pkg._id);
    const result = await db.collection('token_transactions').deleteMany({ _id: { $in: ids } });
    console.log(`\n✓ Deleted ${result.deletedCount} orphan packages.`);
  } else if (isDryRun) {
    console.log(`\n[DRY RUN] Would delete ${toDelete.length} packages. Run without --dry-run to apply.`);
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
