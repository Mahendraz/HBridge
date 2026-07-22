/**
 * Fix WeeklySchedule slots that have no packageId.
 * For each unlinked slot, find the child's most recent topup TokenTransaction
 * and link the slot to it (sets packageId + totalSessions).
 *
 * Slots where no matching package can be found are listed at the end —
 * you can then decide to delete them manually.
 *
 * Run: node scripts/fix-unlinked-slots.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read .env.local manually (dotenv not installed in this project)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = val;
  }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Find all slots with no packageId
  const unlinked = await db
    .collection('weeklyschedules')
    .find({ $or: [{ packageId: null }, { packageId: { $exists: false } }] })
    .toArray();

  console.log(`\nFound ${unlinked.length} slot(s) with no packageId:`);
  if (unlinked.length === 0) {
    console.log('Nothing to fix.');
    await mongoose.disconnect();
    return;
  }

  for (const s of unlinked) {
    console.log(`  - ${s.patientName} (${s.therapyType}) | ${s.day} ${s.hour}:00 | _id=${s._id}`);
  }

  const fixed = [];
  const noPackage = [];

  for (const slot of unlinked) {
    const childId = new mongoose.Types.ObjectId(slot.patientId);

    // Find the most recent topup transaction for this child (with package)
    const tx = await db.collection('token_transactions').findOne(
      { childId, type: 'topup', packageType: { $ne: null } },
      { sort: { createdAt: -1 } }
    );

    if (!tx) {
      noPackage.push(slot);
      continue;
    }

    // Check how many sessions exist for this package
    const sessionCount = await db.collection('sessions').countDocuments({
      packageId: tx._id,
      isActive: true,
    });

    // Link the slot to the package
    await db.collection('weeklyschedules').updateOne(
      { _id: slot._id },
      {
        $set: {
          packageId: tx._id.toString(),
          totalSessions: tx.amount,
        },
      }
    );

    fixed.push({
      slotId: slot._id,
      patient: slot.patientName,
      therapyType: slot.therapyType,
      packageTxId: tx._id,
      totalSessions: tx.amount,
      sessionsInDB: sessionCount,
    });
  }

  console.log(`\n✓ Fixed ${fixed.length} slot(s):`);
  for (const f of fixed) {
    console.log(
      `  - ${f.patient} (${f.therapyType}): linked to package tx ${f.packageTxId}` +
      ` | totalSessions=${f.totalSessions} | sessions already in DB: ${f.sessionsInDB}`
    );
  }

  if (noPackage.length > 0) {
    console.log(`\n⚠ ${noPackage.length} slot(s) with NO matching package (manual action needed):`);
    for (const s of noPackage) {
      console.log(`  - ${s.patientName} (${s.therapyType}) | _id=${s._id}`);
    }
    console.log('\n  Options:');
    console.log('  1. Assign a package to these patients first, then re-run this script.');
    console.log('  2. Delete these slots:');
    console.log('     node scripts/fix-unlinked-slots.js --delete-orphans');
  }

  // Optional: delete orphan slots when --delete-orphans flag is passed
  if (process.argv.includes('--delete-orphans') && noPackage.length > 0) {
    const orphanIds = noPackage.map((s) => s._id);
    const result = await db
      .collection('weeklyschedules')
      .deleteMany({ _id: { $in: orphanIds } });
    console.log(`\n✓ Deleted ${result.deletedCount} orphan slot(s).`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
