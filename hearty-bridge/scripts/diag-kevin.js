const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Find Kevin
  const child = await db.collection('children').findOne({ name: { $regex: /kevin/i } });
  if (!child) { console.log('Kevin tidak ditemukan'); process.exit(1); }
  console.log(`\n=== Child: ${child.name} (${child._id}) ===`);
  console.log(`  tokenBalance: ${child.tokenBalance}`);

  // Token transactions (packages)
  const txs = await db.collection('token_transactions')
    .find({ childId: child._id, type: 'topup' })
    .sort({ createdAt: -1 }).toArray();
  console.log(`\n=== Token Transactions (${txs.length} topup) ===`);
  for (const t of txs) {
    const sessionCount = await db.collection('sessions').countDocuments({ packageId: t._id, isActive: true });
    console.log(`  [${t._id}] ${t.packageType} | amount=${t.amount} | sessions in DB=${sessionCount} | ${t.createdAt?.toISOString().slice(0,10)}`);
  }

  // Weekly schedule slots for Kevin
  const slots = await db.collection('weeklyschedules')
    .find({ patientId: child._id, isActive: true }).toArray();
  console.log(`\n=== Weekly Schedule Slots (${slots.length}) ===`);
  for (const s of slots) {
    const sessionCount = await db.collection('sessions').countDocuments({ weeklyScheduleId: s._id, isActive: true });
    console.log(`  [${s._id}] day=${s.dayOfWeek} time=${s.time} | packageId=${s.packageId} | effectiveFrom=${s.effectiveFrom?.toISOString().slice(0,10)} | effectiveUntil=${s.effectiveUntil?.toISOString().slice(0,10) ?? 'null'} | sessions linked=${sessionCount}`);
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
