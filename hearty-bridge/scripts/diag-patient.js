const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname,'..', '.env.local'),'utf-8').split(/\r?\n/);
  for (const l of lines) { const i=l.indexOf('='); if(i<0||l.trim().startsWith('#'))continue; process.env[l.slice(0,i).trim()]=l.slice(i+1).trim().replace(/^['"]|['"]$/g,''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async()=>{
  const db = mongoose.connection.db;
  const patientId = '6a3f334f38fc11c510f3db5d'; // Laila Rahayu

  const child = await db.collection('children').findOne({ _id: new mongoose.Types.ObjectId(patientId) });
  console.log('\nChild:', child?.name, '| tokenBalance:', child?.tokenBalance);

  const txs = await db.collection('token_transactions')
    .find({ childId: new mongoose.Types.ObjectId(patientId) })
    .sort({ createdAt: -1 }).toArray();
  console.log('\nToken transactions:');
  for (const t of txs) console.log(' ', t.type, '| packageType:', t.packageType, '| amount:', t.amount, '| _id:', t._id);

  const slots = await db.collection('weeklyschedules').find({ patientId }).toArray();
  console.log('\nSlots:');
  for (const s of slots) console.log(' ', s.day, s.hour, '| packageId:', s.packageId);

  await mongoose.disconnect();
}).catch(e=>{ console.error(e.message); process.exit(1); });
