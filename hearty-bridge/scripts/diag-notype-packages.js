const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  for (const name of ['Radit Santoso', 'Rizky Kusuma']) {
    const child = await db.collection('children').findOne({ name });
    const pkgs = await db.collection('token_transactions').find({ childId: child._id, type: 'topup', packageType: { $ne: null } }).toArray();
    console.log(`\n=== ${name} ===`);
    for (const p of pkgs) {
      const slots = await db.collection('weeklyschedules').find({ packageId: p._id.toString() }).toArray();
      const completed = await db.collection('sessions').countDocuments({ packageId: p._id, status: 'completed' });
      const total = await db.collection('sessions').countDocuments({ packageId: p._id });
      console.log(`  [${p._id}] packageType=${p.packageType} therapyType=${p.therapyType}`);
      console.log(`    completed=${completed}/${total}  slots=${slots.map(s => `${s.day} ${s.hour}:00 (slot.therapyType=${s.therapyType})`).join(' | ') || '(none)'}`);
    }
  }
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
