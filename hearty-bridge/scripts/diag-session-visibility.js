/**
 * For each package-linked slot, simulate the GET visibility calculation:
 * how many weeks is the slot visible (past + future from today)?
 */
const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();

function getMondayOfWeek(dateStr) {
  const base = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  const day = base.getUTCDay();
  const toMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(base);
  mon.setUTCDate(base.getUTCDate() + toMon);
  mon.setUTCHours(0, 0, 0, 0);
  return mon;
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const today = getMondayOfWeek();

  // Get unique slots (deduplicate by patientId+packageId to avoid duplicates)
  const seen = new Set();
  const slots = (await db.collection('weeklyschedules').find({ packageId: { $ne: null } }).toArray())
    .filter(s => {
      const key = `${s.patientId}_${s.packageId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  console.log(`\nVisibility simulation for ${slots.length} unique patient-package combinations:\n`);

  for (const slot of slots) {
    const pkgId = new mongoose.Types.ObjectId(slot.packageId);
    const sessions = await db.collection('sessions')
      .find({ packageId: pkgId, isActive: true })
      .sort({ date: 1 })
      .toArray();

    const total = slot.totalSessions;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const totalInDB = sessions.length;

    // Count sessions before today's Monday
    const countBefore = sessions.filter(s => new Date(s.date) < today).length;

    // Simulate: current week session number
    const currentSessionNum = countBefore + 1;

    // Future: how many more weeks visible?
    let futureVisible = 0;
    for (let w = 1; w <= 52; w++) {
      const est = completed + w + 1;
      if (est > total) break;
      futureVisible++;
    }

    const totalVisible = (currentSessionNum <= total ? 1 : 0) + futureVisible;
    const missingSessionsInDB = total - totalInDB;
    const flag = totalVisible !== total ? ` ← shows ${totalVisible} of ${total}` : '';

    console.log(`${slot.patientName} | ${slot.day} ${slot.hour}:00`);
    console.log(`  pkg: ${total} sessions | ${totalInDB} in DB | ${completed} completed | ${countBefore} before today`);
    console.log(`  calendar: current=sesi${currentSessionNum} + ${futureVisible} future = ${totalVisible} visible${flag}`);
    if (missingSessionsInDB > 0) console.log(`  ⚠ ${missingSessionsInDB} sessions MISSING from DB`);
    console.log();
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
