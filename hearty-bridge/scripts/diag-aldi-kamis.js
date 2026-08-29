const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const pkgId = new mongoose.Types.ObjectId('6a5dfb6ff3687221836286d7');
  const sessions = await db.collection('sessions').find({ packageId: pkgId }).sort({ date: 1 }).toArray();
  console.log('Sessions for package 6a5dfb6ff3687221836286d7:');
  for (const s of sessions) {
    console.log(`  ${s.date.toISOString().slice(0,10)} ${s.time} status=${s.status} num=${s.sessionNumber}`);
  }
  const slots = await db.collection('weeklyschedules').find({ packageId: pkgId.toString() }).toArray();
  console.log('\nLinked WeeklySchedule slots:');
  for (const sl of slots) {
    console.log(`  ${sl.day} ${sl.hour}:00 effectiveFrom=${sl.effectiveFrom?.toISOString?.().slice(0,10)} effectiveUntil=${sl.effectiveUntil?.toISOString?.().slice(0,10) ?? 'null'}`);
  }
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
