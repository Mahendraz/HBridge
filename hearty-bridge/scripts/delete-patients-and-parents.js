/**
 * Hapus semua data pasien (children) dan akun orang tua (parent users).
 * Akun therapist, admin, super_admin TIDAK tersentuh.
 *
 * Jalankan: node scripts/delete-patients-and-parents.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI tidak ditemukan di .env.local');
  process.exit(1);
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Preview dulu sebelum hapus
  const childCount  = await db.collection('children').countDocuments({});
  const parentCount = await db.collection('users').countDocuments({ role: 'parent' });

  console.log(`\nAkan dihapus:`);
  console.log(`  - ${childCount} pasien (children)`);
  console.log(`  - ${parentCount} akun orang tua (parent users)`);

  if (childCount === 0 && parentCount === 0) {
    console.log('\nTidak ada data yang perlu dihapus.');
    await mongoose.disconnect();
    return;
  }

  // Hapus children
  const childResult = await db.collection('children').deleteMany({});
  console.log(`\n✓ Deleted children: ${childResult.deletedCount}`);

  // Hapus parent users
  const parentResult = await db.collection('users').deleteMany({ role: 'parent' });
  console.log(`✓ Deleted parent users: ${parentResult.deletedCount}`);

  // Bersihkan weekly schedules yang mengacu ke pasien yg sudah dihapus
  const scheduleResult = await db.collection('weeklyschedules').deleteMany({});
  console.log(`✓ Deleted weekly schedules: ${scheduleResult.deletedCount}`);

  // Bersihkan laporan milik pasien yg sudah dihapus
  const reportResult = await db.collection('reports').deleteMany({});
  console.log(`✓ Deleted reports: ${reportResult.deletedCount}`);

  // Bersihkan sessions
  const sessionResult = await db.collection('sessions').deleteMany({});
  console.log(`✓ Deleted sessions: ${sessionResult.deletedCount}`);

  // Bersihkan invoices
  const invoiceResult = await db.collection('invoices').deleteMany({});
  console.log(`✓ Deleted invoices: ${invoiceResult.deletedCount}`);

  console.log('\nSelesai. Akun therapist, admin, dan super_admin tidak tersentuh.');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
