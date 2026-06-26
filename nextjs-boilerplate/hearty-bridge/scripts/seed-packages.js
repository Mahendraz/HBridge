/**
 * Seed initial therapy packages.
 * Run from Windows PowerShell:
 *   node scripts\seed-packages.js
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hearty-bridge';

const PackageSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    sessions:    { type: Number, required: true, min: 1 },
    price:       { type: Number, required: true, min: 0 },
    therapyType: { type: String, required: true, enum: ['OT', 'TW', 'both'] },
    description: { type: String, default: '' },
    isActive:    { type: Boolean, default: true },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'packages' }
);

const UserSchema = new mongoose.Schema({ role: String }, { collection: 'users' });

const SEED_PACKAGES = [
  { name: 'Gold OT',      sessions: 8,  price: 50000,  therapyType: 'OT',  description: 'Paket Gold untuk Terapi Okupasi (8 sesi)' },
  { name: 'Gold TW',      sessions: 8,  price: 50000,  therapyType: 'TW',  description: 'Paket Gold untuk Terapi Wicara (8 sesi)' },
  { name: 'Platinum OT',  sessions: 12, price: 100000, therapyType: 'OT',  description: 'Paket Platinum untuk Terapi Okupasi (12 sesi)' },
  { name: 'Platinum TW',  sessions: 12, price: 100000, therapyType: 'TW',  description: 'Paket Platinum untuk Terapi Wicara (12 sesi)' },
  { name: 'Diamond OT',   sessions: 16, price: 200000, therapyType: 'OT',  description: 'Paket Diamond untuk Terapi Okupasi (16 sesi)' },
  { name: 'Diamond TW',   sessions: 16, price: 200000, therapyType: 'TW',  description: 'Paket Diamond untuk Terapi Wicara (16 sesi)' },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Package = mongoose.model('Package', PackageSchema);
  const User    = mongoose.model('User', UserSchema);

  // Find first super_admin or admin to use as createdBy
  let creator = await User.findOne({ role: 'super_admin' }).lean();
  if (!creator) {
    creator = await User.findOne({ role: 'admin' }).lean();
  }
  if (!creator) {
    console.error('No admin or super_admin user found. Create one first.');
    process.exit(1);
  }

  console.log(`Using creator: ${creator._id} (${creator.role})`);

  let created = 0;
  let skipped = 0;

  for (const pkg of SEED_PACKAGES) {
    const existing = await Package.findOne({ name: pkg.name });
    if (existing) {
      console.log(`  SKIP  ${pkg.name} (already exists)`);
      skipped++;
    } else {
      await Package.create({ ...pkg, createdBy: creator._id });
      console.log(`  CREATE ${pkg.name} — ${pkg.sessions} sesi, Rp ${pkg.price.toLocaleString('id-ID')}`);
      created++;
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
