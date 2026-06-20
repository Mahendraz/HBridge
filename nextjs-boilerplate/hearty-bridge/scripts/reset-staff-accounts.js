/**
 * Reset staff accounts:
 *  - Hapus semua user role 'therapist'
 *  - Buat akun therapist: Dinda (OT), Haya (TW), Dhea (OT)
 *  - Buat akun admin: Citra
 *
 * Run via PowerShell:
 *   powershell.exe -Command "cd 'E:\Work\Hendra\HBridge\nextjs-boilerplate\hearty-bridge'; node scripts\reset-staff-accounts.js 2>&1"
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const ATLAS_URI = 'mongodb+srv://nehard:ETe807uQjRZYonFs@nehard.yl6xhcq.mongodb.net/hearty-bridge';

function randomPassword(len = 12) {
  return crypto.randomBytes(len).toString('base64').slice(0, len);
}

const newStaff = [
  { name: 'Dinda',  email: 'dinda@hb.com',  role: 'therapist', specialization: 'Terapi Okupasi' },
  { name: 'Haya',   email: 'haya@hb.com',   role: 'therapist', specialization: 'Terapi Wicara'  },
  { name: 'Dhea',   email: 'dhea@hb.com',   role: 'therapist', specialization: 'Terapi Okupasi' },
  { name: 'Citra',  email: 'citra@hb.com',  role: 'admin',     specialization: null              },
];

async function run() {
  console.log('Connecting to Atlas...');
  await mongoose.connect(ATLAS_URI);
  console.log('Connected.\n');

  const db = mongoose.connection.db;
  const col = db.collection('users');

  // ── 1. Hapus semua terapis lama ──────────────────────────────────────────
  const del = await col.deleteMany({ role: 'therapist' });
  console.log(`Deleted ${del.deletedCount} therapist account(s).\n`);

  // ── 2. Buat akun baru ────────────────────────────────────────────────────
  console.log('Creating accounts:');
  const results = [];

  for (const staff of newStaff) {
    const password = randomPassword();
    const hash     = await bcrypt.hash(password, 12);

    // Hapus dulu kalau emailnya sudah ada (untuk admin Citra misalnya)
    await col.deleteOne({ email: staff.email });

    const doc = {
      name:     staff.name,
      email:    staff.email,
      password: hash,
      role:     staff.role,
      isActive: true,
      profile: staff.specialization
        ? { specialization: [staff.specialization] }
        : {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await col.insertOne(doc);
    results.push({ ...staff, password });
    console.log(`  ✓ [${staff.role.padEnd(9)}] ${staff.name.padEnd(8)} ${staff.email}  pass: ${password}`);
  }

  console.log('\n=== Summary ===');
  console.log('Role       | Nama   | Email          | Password');
  console.log('-----------|--------|----------------|-------------');
  for (const r of results) {
    console.log(`${r.role.padEnd(10)} | ${r.name.padEnd(6)} | ${r.email.padEnd(14)} | ${r.password}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
