/**
 * Reset password satu user dari command line.
 *
 * Dipakai kalau akun tidak bisa dijangkau lewat UI (mis. akun admin/super admin,
 * atau saat tidak ada yang bisa login sama sekali). Password lama TIDAK bisa
 * dibaca — yang tersimpan cuma hash bcrypt, jadi satu-satunya jalan ya di-reset.
 *
 * Pakai:
 *   node scripts/reset-user-password.js <email-atau-nama> [password-baru] [--no-force-change]
 *
 * Contoh:
 *   node scripts/reset-user-password.js salsabilahaya@gmail.com
 *   node scripts/reset-user-password.js salsabilahaya@gmail.com Rahasia#2026
 *   node scripts/reset-user-password.js "salsabila haya" --no-force-change
 *
 * Tanpa argumen password, script akan generate password sementara acak.
 * Secara default `mustChangePassword` diset true supaya user wajib menggantinya
 * sendiri saat login berikutnya; matikan dengan --no-force-change.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12; // samakan dengan pre-save hook di models/User.ts

// ── Baca MONGODB_URI dari .env.local (dotenv tidak terpasang di project ini) ──
function readMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local tidak ditemukan dan MONGODB_URI tidak diset di environment.');
  }
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => /^\s*MONGODB_URI\s*=/.test(l));
  if (!line) {
    throw new Error('MONGODB_URI tidak ada di .env.local.');
  }
  return line.replace(/^\s*MONGODB_URI\s*=/, '').trim().replace(/^["']|["']$/g, '');
}

// ── Generator password sementara ──────────────────────────────────────────────
// Karakter yang gampang ketuker saat dibacakan (0/O, 1/l/I) sengaja dibuang.
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGIT = '23456789';
const SYMBOL = '!@#$%&*?';
const ALL = LOWER + UPPER + DIGIT + SYMBOL;

function pick(pool) {
  return pool[require('crypto').randomInt(pool.length)];
}

function generateTempPassword(length = 12) {
  const size = Math.max(8, length);
  const chars = [pick(LOWER), pick(UPPER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < size) chars.push(pick(ALL));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = require('crypto').randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const rawArgs = process.argv.slice(2);
  const forceChange = !rawArgs.includes('--no-force-change');
  const args = rawArgs.filter((a) => !a.startsWith('--'));

  const [identifier, providedPassword] = args;

  if (!identifier) {
    console.error('Pakai: node scripts/reset-user-password.js <email-atau-nama> [password-baru] [--no-force-change]');
    process.exit(1);
  }

  if (providedPassword && providedPassword.length < 8) {
    console.error('Password baru minimal 8 karakter.');
    process.exit(1);
  }

  const uri = readMongoUri();
  console.log(`Menyambung ke ${uri.replace(/\/\/[^@]*@/, '//***:***@')} ...`);
  await mongoose.connect(uri);

  const users = mongoose.connection.db.collection('users');

  // Cocokkan email persis dulu; kalau tidak ada, jatuh ke pencarian nama parsial.
  const escaped = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let matches = await users.find({ email: identifier.toLowerCase().trim() }).toArray();
  if (matches.length === 0) {
    matches = await users.find({ name: new RegExp(escaped, 'i') }).toArray();
  }

  if (matches.length === 0) {
    console.error(`Tidak ada user yang cocok dengan "${identifier}".`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (matches.length > 1) {
    console.error(`Ada ${matches.length} user yang cocok — sebutkan email-nya biar pasti:`);
    matches.forEach((u) => console.error(`  - ${u.name} <${u.email}> [${u.role}]`));
    await mongoose.disconnect();
    process.exit(1);
  }

  const target = matches[0];
  const password = providedPassword || generateTempPassword();
  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  await users.updateOne(
    { _id: target._id },
    { $set: { password: hash, mustChangePassword: forceChange, updatedAt: new Date() } }
  );

  console.log('\n=== PASSWORD DIRESET ===');
  console.log(`  Nama     : ${target.name}`);
  console.log(`  Email    : ${target.email}`);
  console.log(`  Role     : ${target.role}`);
  console.log(`  Password : ${password}`);
  console.log(
    `  Wajib ganti saat login berikutnya: ${forceChange ? 'ya' : 'tidak'}`
  );
  console.log('\nCatat password di atas sekarang — setelah ini yang tersimpan cuma hash-nya.\n');

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('[ERROR]', err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
