/**
 * List children with more than one package (TokenTransaction topup with packageType),
 * showing each package's therapyType, amount, session counts, and linked WeeklySchedule slots.
 */
const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const pkgs = await db.collection('token_transactions')
    .find({ type: 'topup', packageType: { $ne: null } })
    .sort({ childId: 1, createdAt: 1 })
    .toArray();

  const byChild = new Map();
  for (const p of pkgs) {
    const key = p.childId.toString();
    if (!byChild.has(key)) byChild.set(key, []);
    byChild.get(key).push(p);
  }

  const multi = [...byChild.entries()].filter(([, list]) => list.length > 1);
  console.log(`\n${byChild.size} children have at least 1 package. ${multi.length} have more than 1.\n`);

  for (const [childId, list] of multi) {
    const child = await db.collection('children').findOne({ _id: new mongoose.Types.ObjectId(childId) });
    console.log(`=== ${child?.name ?? '(unknown)'} — ${list.length} packages ===`);
    for (const p of list) {
      const sessionCount = await db.collection('sessions').countDocuments({ packageId: p._id });
      const slots = await db.collection('weeklyschedules').find({ packageId: p._id.toString() }).toArray();
      console.log(`  [${p._id}] ${p.packageType} ${p.therapyType ?? 'no-type'} amount=${p.amount} createdAt=${p.createdAt?.toISOString?.().slice(0,10)}`);
      console.log(`    sessions in DB: ${sessionCount} | linked slots: ${slots.map(s => `${s.day} ${s.hour}:00`).join(', ') || '(none)'}`);
    }
    console.log();
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
