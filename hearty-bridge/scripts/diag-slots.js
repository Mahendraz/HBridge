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
  const slots = await db.collection('weeklyschedules')
    .find({})
    .project({ patientName: 1, day: 1, hour: 1, packageId: 1, totalSessions: 1 })
    .toArray();

  console.log('\nAll WeeklySchedule slots:');
  for (const s of slots) {
    const pkgId = s.packageId;
    const isValidOid = pkgId && /^[0-9a-f]{24}$/i.test(pkgId);
    console.log(
      `  ${s.patientName} | ${s.day} ${s.hour}:00 | packageId=${pkgId} | validOid=${isValidOid} | totalSessions=${s.totalSessions}`
    );
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
