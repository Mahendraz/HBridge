/**
 * Find slots where totalSessions doesn't match the linked package's actual amount.
 * Also shows completed session counts so we can see why calendar cuts off early.
 */
const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const slots = await db.collection('weeklyschedules').find({ packageId: { $ne: null } }).toArray();
  console.log(`\nChecking ${slots.length} package-linked slots...\n`);

  for (const slot of slots) {
    const pkg = await db.collection('token_transactions').findOne({ _id: new mongoose.Types.ObjectId(slot.packageId) });
    if (!pkg) { console.log(`  [ORPHAN] ${slot.patientName} ${slot.day} ${slot.hour}:00 | packageId=${slot.packageId} not found`); continue; }

    const total = await db.collection('sessions').countDocuments({ packageId: new mongoose.Types.ObjectId(slot.packageId), isActive: true });
    const completed = await db.collection('sessions').countDocuments({ packageId: new mongoose.Types.ObjectId(slot.packageId), isActive: true, status: 'completed' });
    const mismatch = slot.totalSessions !== pkg.amount ? ' ← MISMATCH' : '';

    console.log(`${slot.patientName} | ${slot.day} ${slot.hour}:00`);
    console.log(`  slot.totalSessions=${slot.totalSessions}  pkg.amount=${pkg.amount}${mismatch}`);
    console.log(`  sessions in DB: ${total} total, ${completed} completed`);
    console.log(`  pkg: ${pkg.packageType} ${pkg.therapyType ?? 'no-type'}`);
    console.log();
  }

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
