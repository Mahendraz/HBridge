const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Check a few patients
  const children = await db.collection('children').find({ isActive: true }).limit(5).toArray();

  for (const child of children) {
    const txs = await db.collection('token_transactions')
      .find({ childId: child._id, type: 'topup' })
      .sort({ createdAt: -1 }).toArray();

    if (txs.length === 0) continue;

    console.log(`\n=== ${child.name} ===`);
    for (const tx of txs) {
      // Session.packageId = TokenTransaction._id
      const sessionCount = await db.collection('sessions').countDocuments({ packageId: tx._id, isActive: true });
      const remaining = Math.max(0, tx.amount - sessionCount);
      console.log(`  [${tx.therapyType ?? 'both'}] ${tx.packageType}: amount=${tx.amount}, inDB=${sessionCount}, remaining=${remaining}`);
    }
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
