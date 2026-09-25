/**
 * migrate-leave-cuti-to-sakit-izin.js
 * Renames the legacy therapist leave type 'cuti' to 'sakit_izin' (ADM-4:
 * status Aktif / Sakit-Izin / Inaktif). The app already treats 'cuti' as
 * 'sakit_izin', so this is cleanup — safe to run more than once.
 *
 * Usage: node scripts/migrate-leave-cuti-to-sakit-izin.js
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function readMongoUriFromEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const line = fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('MONGODB_URI='));
    return line ? line.slice('MONGODB_URI='.length).trim().replace(/^["']|["']$/g, '') : null;
  } catch {
    return null;
  }
}

async function run() {
  const uri = process.env.MONGODB_URI || readMongoUriFromEnvLocal() || 'mongodb://localhost:27017/hearty-bridge';
  await mongoose.connect(uri);
  const leaves = mongoose.connection.db.collection('therapist_leaves');

  const count = await leaves.countDocuments({ type: 'cuti' });
  console.log(`Found ${count} leave record(s) with type 'cuti'`);

  if (count > 0) {
    const result = await leaves.updateMany({ type: 'cuti' }, { $set: { type: 'sakit_izin' } });
    console.log(`Updated ${result.modifiedCount} record(s) to 'sakit_izin'`);
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
