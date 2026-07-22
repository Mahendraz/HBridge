const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Find Aldi
  const aldi = await db.collection('children').findOne({ name: /aldi/i });
  if (!aldi) { console.log('Aldi not found'); await mongoose.disconnect(); return; }

  console.log('\nChild:', aldi.name, '| _id:', aldi._id);
  console.log('tokenBalance:', aldi.tokenBalance);
  console.log('therapyBalance:', JSON.stringify(aldi.therapyBalance ?? {}));

  // All his TokenTransactions
  const txs = await db.collection('token_transactions')
    .find({ childId: aldi._id })
    .sort({ createdAt: -1 })
    .toArray();
  console.log('\nToken transactions (' + txs.length + '):');
  for (const t of txs) {
    console.log(`  [${t._id}] type=${t.type} | packageType=${t.packageType} | therapyType=${t.therapyType} | amount=${t.amount}`);
  }

  // All his WeeklySchedule slots
  const slots = await db.collection('weeklyschedules').find({ patientId: aldi._id.toString() }).toArray();
  console.log('\nWeeklySchedule slots (' + slots.length + '):');
  for (const s of slots) {
    console.log(`  ${s.day} ${s.hour}:00 | packageId=${s.packageId} | therapyType=${s.therapyType}`);
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
