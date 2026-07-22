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

  // Slots sorted by creation date (most recent first)
  const slots = await db.collection('weeklyschedules')
    .find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  console.log('\nMost recent 5 slots:');
  for (const s of slots) {
    console.log(`  ${s.patientName} | ${s.day} ${s.hour}:00 | pkgId=${s.packageId} | created=${s.createdAt}`);
  }

  // Sessions sorted by creation date (most recent)
  const sessions = await db.collection('sessions')
    .find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  console.log('\nMost recent 10 sessions:');
  for (const s of sessions) {
    console.log(`  childId=${s.childId} | packageId=${s.packageId} | session ${s.sessionNumber}/${s.totalSessions} | date=${s.date?.toISOString()?.split('T')[0]} | status=${s.status}`);
  }

  // Check if any session has a packageId that's NOT a valid ObjectId-format string
  const allSessions = await db.collection('sessions').find({ isActive: true }).toArray();
  const badSessions = allSessions.filter(s => {
    if (!s.packageId) return true;
    const str = s.packageId.toString();
    return !/^[0-9a-f]{24}$/i.test(str);
  });
  console.log(`\nSessions with invalid/missing packageId: ${badSessions.length}`);
  for (const s of badSessions) {
    console.log(`  childId=${s.childId} | packageId=${s.packageId}`);
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
