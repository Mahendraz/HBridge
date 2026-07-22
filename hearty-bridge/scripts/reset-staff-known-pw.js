/**
 * Reset staff accounts with KNOWN passwords for testing.
 * Run: node scripts/reset-staff-known-pw.js
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const ATLAS_URI = 'mongodb+srv://nehard:ETe807uQjRZYonFs@nehard.yl6xhcq.mongodb.net/hearty-bridge';

const KNOWN_STAFF = [
  { name: 'Dinda',  email: 'dinda@hb.com',  role: 'therapist', password: 'Dinda@HB2024!', specialization: 'Terapi Okupasi' },
  { name: 'Haya',   email: 'haya@hb.com',   role: 'therapist', password: 'Haya@HB2024!',  specialization: 'Terapi Wicara'  },
  { name: 'Dhea',   email: 'dhea@hb.com',   role: 'therapist', password: 'Dhea@HB2024!',  specialization: 'Terapi Okupasi' },
  { name: 'Citra',  email: 'citra@hb.com',  role: 'admin',     password: 'Citra@HB2024!', specialization: null              },
  { name: 'Admin',  email: 'admin@heartybridge.com', role: 'admin', password: 'Admin@HB2024!', specialization: null },
];

async function run() {
  console.log('Connecting to Atlas...');
  await mongoose.connect(ATLAS_URI);
  console.log('Connected.\n');

  const db  = mongoose.connection.db;
  const col = db.collection('users');

  console.log('Resetting accounts with known passwords:');
  for (const s of KNOWN_STAFF) {
    const hash = await bcrypt.hash(s.password, 12);
    await col.updateOne(
      { email: s.email },
      {
        $set: {
          name:     s.name,
          email:    s.email,
          password: hash,
          role:     s.role,
          isActive: true,
          ...(s.specialization ? { profile: { specialization: [s.specialization] } } : {}),
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    console.log(`  ✓ [${s.role.padEnd(9)}] ${s.name.padEnd(8)} ${s.email.padEnd(28)} pass: ${s.password}`);
  }

  console.log('\n=== DONE ===');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
