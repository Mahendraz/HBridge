const fs = require('fs'), path = require('path'), mongoose = require('mongoose');
function loadEnv() {
  const lines = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8').split(/\r?\n/);
  for (const l of lines) { const i = l.indexOf('='); if (i < 0 || l.trim().startsWith('#')) continue; process.env[l.slice(0,i).trim()] = l.slice(i+1).trim().replace(/^['"]|['"]$/g, ''); }
}
loadEnv();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const ids = ['6a5e2242f3687221836286e7', '6a5e2257f3687221836286f1'].map(id => new mongoose.Types.ObjectId(id));
  const result = await db.collection('weeklyschedules').deleteMany({ _id: { $in: ids } });
  console.log(`Deleted ${result.deletedCount} duplicate slot(s).`);
  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
