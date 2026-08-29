const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const child = await db.collection('children').findOne({ name: 'Aldi Supriyadi' });
  const slots = await db.collection('weeklyschedules').find({ patientId: child._id.toString() }).toArray();
  console.log(`Aldi Supriyadi (${child._id}) — ${slots.length} raw WeeklySchedule docs:\n`);
  for (const s of slots) {
    console.log(`[${s._id}] ${s.day} ${s.hour}:00  therapyType=${s.therapyType}  packageId=${s.packageId}`);
    console.log(`  effectiveFrom=${s.effectiveFrom?.toISOString?.().slice(0,10)}  effectiveUntil=${s.effectiveUntil?.toISOString?.().slice(0,10) ?? 'null'}  totalSessions=${s.totalSessions}`);
  }
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
