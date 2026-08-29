const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const pkgId = new mongoose.Types.ObjectId('6a5f2efb15ec04f5037b1fdb');
  const pkg = await db.collection('token_transactions').findOne({ _id: pkgId });
  const slots = await db.collection('weeklyschedules').find({ packageId: pkgId.toString() }).toArray();
  console.log('Package therapyType (before):', pkg.therapyType);
  console.log('Linked slot(s):', slots.map(s => `${s.day} ${s.hour}:00 therapyType=${s.therapyType}`));
  const realType = slots.find(s => s.therapyType)?.therapyType;
  if (!realType) { console.log('No linked slot has a therapyType — nothing to fix.'); await mongoose.disconnect(); return; }
  if (pkg.therapyType === realType) { console.log('Already consistent — nothing to fix.'); await mongoose.disconnect(); return; }
  await db.collection('token_transactions').updateOne({ _id: pkgId }, { $set: { therapyType: realType } });
  console.log(`Fixed: package therapyType ${pkg.therapyType} -> ${realType}`);
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
