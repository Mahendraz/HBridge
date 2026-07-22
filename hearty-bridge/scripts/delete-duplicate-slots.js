/**
 * Delete the duplicate WeeklySchedule slots that were created as orphans
 * (Kevin senin 9:00, Rizky senin 9:00, Keisha rabu 9:00) — these share a
 * packageId with the patient's real slot and cause double entries in the calendar.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
  }
}
loadEnv();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Find patients who have MORE THAN ONE slot with the same packageId
  const slots = await db.collection('weeklyschedules').find({ packageId: { $ne: null } }).toArray();

  // Group by (patientId, packageId)
  const groups = {};
  for (const s of slots) {
    const key = `${s.patientId}_${s.packageId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }

  const duplicateGroups = Object.values(groups).filter(g => g.length > 1);

  if (duplicateGroups.length === 0) {
    console.log('No duplicate slots found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`\nFound ${duplicateGroups.length} group(s) with duplicate slots:`);

  const toDelete = [];

  for (const group of duplicateGroups) {
    // Sort by createdAt descending — keep the OLDEST slot (it's the real one),
    // delete the newer ones (the orphans created later without proper context)
    group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const keep = group[0];
    const extras = group.slice(1);

    console.log(`\n  Patient: ${keep.patientName} | packageId=${keep.packageId}`);
    console.log(`  KEEP:   ${keep.day} ${keep.hour}:00 | _id=${keep._id} | created=${keep.createdAt}`);
    for (const e of extras) {
      console.log(`  DELETE: ${e.day} ${e.hour}:00 | _id=${e._id} | created=${e.createdAt}`);
      toDelete.push(e._id);
    }
  }

  if (toDelete.length > 0) {
    const result = await db.collection('weeklyschedules').deleteMany({ _id: { $in: toDelete } });
    console.log(`\n✓ Deleted ${result.deletedCount} duplicate slot(s).`);
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
