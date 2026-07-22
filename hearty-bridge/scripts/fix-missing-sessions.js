/**
 * Repair script: generate missing future sessions for all packages where
 * sessionsInDB < totalSessions. Also sets effectiveUntil on each WeeklySchedule
 * slot to the date of the last generated session.
 *
 * Run with: node scripts/fix-missing-sessions.js
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
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Fix missing sessions\n`);

  // Get all unique patient-package pairs from WeeklySchedule
  const seen = new Set();
  const slots = (await db.collection('weeklyschedules').find({ packageId: { $ne: null }, totalSessions: { $gt: 0 } }).toArray())
    .filter(s => {
      const key = `${s.patientId}_${s.packageId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  let totalSessionsCreated = 0;
  let totalSlotsFixed = 0;

  for (const slot of slots) {
    const pkgId = new mongoose.Types.ObjectId(slot.packageId);
    const total = slot.totalSessions;

    const sessions = await db.collection('sessions')
      .find({ packageId: pkgId, isActive: true })
      .sort({ date: 1, sessionNumber: 1 })
      .toArray();

    const existingCount = sessions.length;
    if (existingCount >= total) continue; // nothing to fix

    const missing = total - existingCount;
    const lastSession = sessions[sessions.length - 1];

    // Compute date of the first missing session
    let nextDate;
    if (lastSession) {
      nextDate = new Date(lastSession.date);
      nextDate.setUTCDate(nextDate.getUTCDate() + 7);
    } else {
      // No sessions at all — start from effectiveFrom + find target weekday
      const DAY_TO_IDX = { senin:1, selasa:2, rabu:3, kamis:4, jumat:5, sabtu:6 };
      const targetDayIdx = DAY_TO_IDX[slot.day] ?? 1;
      nextDate = slot.effectiveFrom ? new Date(slot.effectiveFrom) : new Date(today);
      nextDate.setUTCHours(0, 0, 0, 0);
      while (nextDate.getUTCDay() !== targetDayIdx) {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      }
    }

    const startSessionNumber = existingCount + 1;
    const hour = String(slot.hour).padStart(2, '0');

    const newSessions = Array.from({ length: missing }, (_, i) => {
      const d = new Date(nextDate);
      d.setUTCDate(nextDate.getUTCDate() + i * 7);
      return {
        childId: new mongoose.Types.ObjectId(slot.patientId),
        therapistId: new mongoose.Types.ObjectId(slot.therapistId),
        date: d,
        time: `${hour}:00`,
        duration: 60,
        type: 'in-person',
        status: 'scheduled',
        packageId: pkgId,
        sessionNumber: startSessionNumber + i,
        totalSessions: total,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const lastNewSessionDate = newSessions[newSessions.length - 1].date;
    const firstNewDate = newSessions[0].date.toISOString().slice(0, 10);
    const lastNewDate = lastNewSessionDate.toISOString().slice(0, 10);

    console.log(`${slot.patientName} | ${slot.day} ${slot.hour}:00`);
    console.log(`  ${existingCount} exist, need ${missing} more (sesi ${startSessionNumber}–${total})`);
    console.log(`  dates: ${firstNewDate} → ${lastNewDate}`);

    if (!isDryRun) {
      await db.collection('sessions').insertMany(newSessions);

      // Update effectiveUntil on ALL WeeklySchedule slots for this patient-package pair
      await db.collection('weeklyschedules').updateMany(
        { patientId: slot.patientId, packageId: slot.packageId },
        { $set: { effectiveUntil: lastNewSessionDate, updatedAt: new Date() } }
      );

      // Update Child.tokenExpiry
      await db.collection('children').updateOne(
        { _id: new mongoose.Types.ObjectId(slot.patientId) },
        { $set: { tokenExpiry: lastNewSessionDate } }
      );

      console.log(`  ✓ inserted ${missing} sessions, effectiveUntil → ${lastNewDate}`);
    } else {
      console.log(`  → would insert ${missing} sessions + set effectiveUntil=${lastNewDate}`);
    }

    totalSessionsCreated += missing;
    totalSlotsFixed++;
    console.log();
  }

  if (totalSlotsFixed === 0) {
    console.log('All packages are complete — nothing to fix.');
  } else {
    console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Done: ${totalSlotsFixed} packages fixed, ${totalSessionsCreated} sessions ${isDryRun ? 'would be' : ''} created.`);
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
