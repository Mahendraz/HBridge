/**
 * Salin akun login (super_admin / admin / therapist) dari DB lama ke DB baru.
 * Data lain (parent, child, report, session, invoice, dst) TIDAK ikut dipindah.
 *
 * Dokumen user disalin apa adanya lewat driver (bukan model), jadi hash password
 * tidak di-hash ulang oleh pre-save hook dan user tetap login dengan password lama.
 * DB sumber hanya dibaca. Aman dijalankan ulang: upsert berdasarkan _id.
 *
 * Env:
 *   SOURCE_MONGODB_URI  DB lama (default: MONGODB_URI di .env.local)
 *   TARGET_MONGODB_URI  DB baru (wajib untuk --migrate / --verify)
 *
 * Pakai:
 *   node scripts/migrate-login-users.js --list
 *   node scripts/migrate-login-users.js --migrate <email> [email ...]
 *   node scripts/migrate-login-users.js --verify
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const LOGIN_ROLES = ['super_admin', 'admin', 'therapist'];

function readEnvLocal(key) {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return undefined;
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => new RegExp(`^\\s*${key}\\s*=`).test(l));
  if (!line) return undefined;
  return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
}

function requireEnv(key, fallback) {
  const value = process.env[key] || fallback;
  if (!value) throw new Error(`${key} belum diset.`);
  return value;
}

async function connect(uri) {
  const conn = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 15000 });
  await conn.asPromise();
  return conn;
}

async function list() {
  const source = await connect(requireEnv('SOURCE_MONGODB_URI', readEnvLocal('MONGODB_URI')));
  try {
    const users = await source.db
      .collection('users')
      .find({ role: { $in: LOGIN_ROLES } }, { projection: { name: 1, email: 1, role: 1, isActive: 1 } })
      .sort({ role: 1, name: 1 })
      .toArray();
    console.log(`DB sumber: ${source.db.databaseName}`);
    for (const u of users) {
      console.log(`${u.role.padEnd(12)} ${String(u.isActive !== false ? 'aktif' : 'nonaktif').padEnd(9)} ${u.email}  (${u.name})`);
    }
  } finally {
    await source.close();
  }
}

async function migrate(emails) {
  if (emails.length === 0) throw new Error('Sebutkan email user yang mau dipindah.');
  const source = await connect(requireEnv('SOURCE_MONGODB_URI', readEnvLocal('MONGODB_URI')));
  const target = await connect(requireEnv('TARGET_MONGODB_URI'));
  try {
    if (source.db.databaseName !== target.db.databaseName) {
      console.warn(`Peringatan: nama DB beda (sumber=${source.db.databaseName}, tujuan=${target.db.databaseName}).`);
    }
    const wanted = emails.map((e) => e.toLowerCase());
    const users = await source.db.collection('users').find({ email: { $in: wanted } }).toArray();

    const missing = wanted.filter((e) => !users.some((u) => u.email === e));
    if (missing.length) throw new Error(`Tidak ditemukan di DB sumber: ${missing.join(', ')}`);
    const wrongRole = users.filter((u) => !LOGIN_ROLES.includes(u.role));
    if (wrongRole.length) throw new Error(`Bukan role login: ${wrongRole.map((u) => u.email).join(', ')}`);

    const targetUsers = target.db.collection('users');
    for (const u of users) {
      await targetUsers.replaceOne({ _id: u._id }, u, { upsert: true });
      console.log(`OK  ${u.role.padEnd(12)} ${u.email}`);
    }

    // Index sama dengan models/User.ts, supaya email tetap unik sebelum app sempat autoIndex.
    await targetUsers.createIndex({ email: 1 }, { unique: true });
    await targetUsers.createIndex({ role: 1 });
    await targetUsers.createIndex({ isActive: 1 });
    await targetUsers.createIndex({ createdAt: -1 });
  } finally {
    await source.close();
    await target.close();
  }
}

async function verify() {
  const target = await connect(requireEnv('TARGET_MONGODB_URI', readEnvLocal('MONGODB_URI')));
  try {
    const collections = (await target.db.listCollections().toArray()).map((c) => c.name);
    const users = await target.db
      .collection('users')
      .find({}, { projection: { email: 1, role: 1, password: 1, isActive: 1, mustChangePassword: 1 } })
      .toArray();
    console.log(`DB tujuan: ${target.db.databaseName}`);
    console.log(`Collections: ${collections.join(', ') || '(kosong)'}`);
    console.log(`Jumlah user: ${users.length}`);
    for (const u of users) {
      const hashed = typeof u.password === 'string' && u.password.startsWith('$2');
      console.log(`${u.role.padEnd(12)} ${u.email}  hash=${hashed ? 'bcrypt' : 'TIDAK VALID'} isActive=${u.isActive} mustChangePassword=${u.mustChangePassword}`);
    }
  } finally {
    await target.close();
  }
}

(async () => {
  const [mode, ...rest] = process.argv.slice(2);
  if (mode === '--list') await list();
  else if (mode === '--migrate') await migrate(rest);
  else if (mode === '--verify') await verify();
  else throw new Error('Mode: --list | --migrate <email...> | --verify');
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
