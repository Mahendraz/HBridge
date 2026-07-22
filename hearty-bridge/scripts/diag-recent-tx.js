const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const txs = await db.collection('token_transactions')
    .find({ type: 'topup', packageType: { $ne: null } })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
  console.log('\n=== Recent TopUp Transactions (raw therapyType from DB) ===');
  for (const t of txs) {
    console.log(`  ${t.childName}: ${t.packageType} | therapyType=${JSON.stringify(t.therapyType)} | amount=${t.amount}`);
  }

  // Also check Package catalog therapyType
  const pkgs = await db.collection('packages').find({}).toArray();
  console.log('\n=== Package Catalog (raw therapyType) ===');
  for (const p of pkgs) console.log(`  ${p.name}: sessions=${p.sessions}, therapyType=${JSON.stringify(p.therapyType)}`);

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
