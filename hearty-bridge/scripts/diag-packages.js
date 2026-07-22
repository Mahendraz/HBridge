const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const pkgs = await db.collection('packages').find({}).sort({ sessions: 1 }).toArray();
  console.log('\n=== Available Packages (Package catalog) ===');
  for (const p of pkgs) console.log(`  ${p.name}: ${p.sessions} sesi, ${p.therapyType}, active=${p.isActive}`);

  const txs = await db.collection('token_transactions').find({ type: 'topup', packageType: { $ne: null } }).sort({ createdAt: -1 }).limit(15).toArray();
  console.log('\n=== Last 15 TopUp Transactions (token_transactions) ===');
  for (const t of txs) console.log(`  ${t.childName}: ${t.packageType} (${t.amount} sesi) @ ${t.createdAt.toISOString().slice(0,10)}`);
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
