/**
 * Fix: clear effectiveUntil on WeeklySchedule slots where it was incorrectly set
 * to a past session date (prevents slot from appearing in current week view).
 * This affects slots created in the "sessions already exist" branch of POST /api/weekly-schedule.
 */
const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const now = new Date();

  // Find slots whose effectiveUntil is in the past (before today)
  const badSlots = await db.collection('weeklyschedules').find({
    effectiveUntil: { $lt: now },
    packageId: { $ne: null },
  }).toArray();

  if (badSlots.length === 0) {
    console.log('No slots with past effectiveUntil found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${badSlots.length} slot(s) with past effectiveUntil:`);
  for (const s of badSlots) {
    console.log(`  ${s.patientName} | ${s.day} ${s.hour}:00 | effectiveUntil: ${s.effectiveUntil?.toISOString()?.split('T')[0]}`);
  }

  const ids = badSlots.map(s => s._id);
  const result = await db.collection('weeklyschedules').updateMany(
    { _id: { $in: ids } },
    { $set: { effectiveUntil: null } }
  );
  console.log(`\n✓ Cleared effectiveUntil on ${result.modifiedCount} slot(s).`);

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
