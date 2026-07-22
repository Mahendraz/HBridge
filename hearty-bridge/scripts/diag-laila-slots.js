const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const slots = await db.collection('weeklyschedules').find({ patientId: '6a3f334f38fc11c510f3db5d' }).toArray();
  console.log('\nLaila slots:');
  for (const s of slots) {
    console.log(`  ${s.day} ${s.hour}:00 | packageId: ${s.packageId} | effectiveFrom: ${s.effectiveFrom?.toISOString() ?? 'null'} | effectiveUntil: ${s.effectiveUntil?.toISOString() ?? 'null'}`);
  }
  // also check last session date for her package
  const txId = '6a3f334f38fc11c510f3db5e';
  const lastSession = await db.collection('sessions').findOne(
    { packageId: new mongoose.Types.ObjectId(txId), isActive: true },
    { sort: { date: -1 }, projection: { date: 1, sessionNumber: 1, totalSessions: 1, status: 1 } }
  );
  console.log('\nLast session for package:', lastSession ? `session ${lastSession.sessionNumber}/${lastSession.totalSessions} on ${lastSession.date?.toISOString()?.split('T')[0]} (${lastSession.status})` : 'none found');
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
