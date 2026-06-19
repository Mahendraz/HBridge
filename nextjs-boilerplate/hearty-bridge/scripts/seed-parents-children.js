/**
 * Seed script: tambah data orang tua + anak ke MongoDB
 * Run via PowerShell: node scripts\seed-parents-children.js
 *
 * Default password semua parent baru: Password123!
 * Script aman dijalankan berulang (skip jika email sudah ada)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/hearty-bridge';

// ── Schemas (minimal, matching actual models) ──────────────────────────────
const userSchema = new mongoose.Schema({
  name:              { type: String, required: true },
  email:             { type: String, required: true, unique: true, lowercase: true },
  password:          { type: String, required: true },
  role:              { type: String, enum: ['parent', 'therapist', 'admin'], required: true },
  phone:             String,
  profile: {
    specialization:  [String],
    clinic:          String,
    experience:      Number,
  },
  isActive:          { type: Boolean, default: true },
  emailVerified:     { type: Boolean, default: false },
  mustChangePassword:{ type: Boolean, default: false },
}, { timestamps: true, collection: 'users' });

const childSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  dateOfBirth: { type: Date,   required: true },
  gender:      { type: String, enum: ['male', 'female'], required: true },
  parentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  medicalInfo: {
    conditions:  [String],
    medications: [String],
    allergies:   [String],
    notes:       String,
  },
  contactInfo: {
    emergencyContact: { name: String, phone: String, relationship: String }
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'children' });

// ── Data ────────────────────────────────────────────────────────────────────

// Orang tua DENGAN anak (1 anak per orang tua)
const PARENTS_WITH_CHILDREN = [
  {
    parent: {
      name:  'Ratna Prasetyo',
      email: 'ratna.prasetyo@gmail.com',
      phone: '+6281298765431',
    },
    // email terapis yg akan di-assign (harus sudah ada di DB)
    therapistEmail: 'sari.wulandari@heartybridge.com',
    child: {
      name:        'Adika Prasetyo',
      dateOfBirth: new Date('2019-03-15'),
      gender:      'male',
      medicalInfo: {
        conditions:  ['Autisme'],
        medications: [],
        allergies:   [],
        notes:       'Dalam program terapi perilaku ABA. Perkembangan komunikasi meningkat.',
      },
      contactInfo: {
        emergencyContact: { name: 'Ratna Prasetyo', phone: '+6281298765431', relationship: 'Ibu' }
      },
    },
  },
  {
    parent: {
      name:  'Dewi Salsabila',
      email: 'dewi.salsabila@gmail.com',
      phone: '+6281298765432',
    },
    therapistEmail: 'budi.santoso@heartybridge.com',
    child: {
      name:        'Kirana Salsabila',
      dateOfBirth: new Date('2020-08-22'),
      gender:      'female',
      medicalInfo: {
        conditions:  ['Keterlambatan Bicara'],
        medications: [],
        allergies:   [],
        notes:       'Menjalani terapi wicara rutin 2x seminggu.',
      },
      contactInfo: {
        emergencyContact: { name: 'Dewi Salsabila', phone: '+6281298765432', relationship: 'Ibu' }
      },
    },
  },
  {
    parent: {
      name:  'Bambang Mahardika',
      email: 'bambang.mahardika@gmail.com',
      phone: '+6281298765433',
    },
    therapistEmail: 'sari.wulandari@heartybridge.com',
    child: {
      name:        'Arjuna Mahardika',
      dateOfBirth: new Date('2018-12-03'),
      gender:      'male',
      medicalInfo: {
        conditions:  ['ADHD'],
        medications: ['Ritalin 10mg'],
        allergies:   [],
        notes:       'Konsumsi Ritalin tiap pagi sebelum sekolah. Perhatian membaik.',
      },
      contactInfo: {
        emergencyContact: { name: 'Bambang Mahardika', phone: '+6281298765433', relationship: 'Ayah' }
      },
    },
  },
  {
    parent: {
      name:  'Sinta Amelia',
      email: 'sinta.amelia@gmail.com',
      phone: '+6281298765434',
    },
    therapistEmail: 'ahmad.rizki@heartybridge.com',
    child: {
      name:        'Zahra Amelia',
      dateOfBirth: new Date('2017-06-20'),
      gender:      'female',
      medicalInfo: {
        conditions:  ['Cerebral Palsy'],
        medications: ['Baclofen 5mg'],
        allergies:   ['Penisilin'],
        notes:       'Fisioterapi 3x seminggu. Mobilitas kaki kanan meningkat.',
      },
      contactInfo: {
        emergencyContact: { name: 'Sinta Amelia', phone: '+6281298765434', relationship: 'Ibu' }
      },
    },
  },
  {
    parent: {
      name:  'Andi Maulana',
      email: 'andi.maulana@gmail.com',
      phone: '+6281298765435',
    },
    therapistEmail: 'linda.maharani@heartybridge.com',
    child: {
      name:        'Raffi Maulana',
      dateOfBirth: new Date('2019-11-25'),
      gender:      'male',
      medicalInfo: {
        conditions:  ['Gangguan Integrasi Sensori'],
        medications: [],
        allergies:   ['Susu sapi'],
        notes:       'Terapi sensori dan motorik kasar. Hindari produk susu sapi.',
      },
      contactInfo: {
        emergencyContact: { name: 'Andi Maulana', phone: '+6281298765435', relationship: 'Ayah' }
      },
    },
  },
];

// Orang tua TANPA anak (belum terdaftar anaknya)
const PARENTS_NO_CHILDREN = [
  {
    name:  'Hendra Kusuma',
    email: 'hendra.kusuma@gmail.com',
    phone: '+6281298765436',
  },
  {
    name:  'Sri Wahyuni',
    email: 'sri.wahyuni@gmail.com',
    phone: '+6281298765437',
  },
  {
    name:  'Faisal Hidayat',
    email: 'faisal.hidayat@gmail.com',
    phone: '+6281298765438',
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Terhubung ke MongoDB\n');

  const User  = mongoose.models.User  || mongoose.model('User',  userSchema);
  const Child = mongoose.models.Child || mongoose.model('Child', childSchema);

  // Hash password default sekali saja
  const defaultPasswordHash = await bcrypt.hash('Password123!', 12);

  // Ambil semua terapis yang ada di DB untuk mapping email → _id
  const therapistDocs = await User.find({ role: 'therapist', isActive: true })
    .select('_id email name').lean();
  const therapistByEmail = {};
  therapistDocs.forEach(t => { therapistByEmail[t.email] = t._id; });
  console.log(`Terapis ditemukan di DB: ${therapistDocs.length}`);
  therapistDocs.forEach(t => console.log(`  • ${t.name} (${t.email})`));
  console.log('');

  let stats = { parentCreated: 0, parentSkipped: 0, childCreated: 0, childSkipped: 0 };

  // ── 1. Parent dengan anak ──────────────────────────────────────────────
  console.log('=== Orang Tua + Anak ===');
  for (const entry of PARENTS_WITH_CHILDREN) {
    const { parent, therapistEmail, child } = entry;

    // Upsert parent
    let parentDoc = await User.findOne({ email: parent.email });
    if (parentDoc) {
      console.log(`↩  [parent] Sudah ada: ${parent.name}`);
      stats.parentSkipped++;
    } else {
      parentDoc = await User.create({
        ...parent,
        password:           defaultPasswordHash,
        role:               'parent',
        isActive:           true,
        emailVerified:      true,
        mustChangePassword: false,
      });
      console.log(`✅ [parent] Dibuat: ${parent.name}`);
      stats.parentCreated++;
    }

    // Upsert child
    const existingChild = await Child.findOne({ name: child.name, parentId: parentDoc._id });
    if (existingChild) {
      console.log(`↩  [anak]   Sudah ada: ${child.name}`);
      stats.childSkipped++;
    } else {
      const therapistId = therapistByEmail[therapistEmail] || undefined;
      await Child.create({
        ...child,
        parentId:    parentDoc._id,
        therapistId: therapistId,
        isActive:    true,
      });
      const therapistNote = therapistId ? `terapis: ${therapistEmail}` : 'tanpa terapis (tidak ditemukan di DB)';
      console.log(`✅ [anak]   Dibuat: ${child.name} — ${therapistNote}`);
      stats.childCreated++;
    }
    console.log('');
  }

  // ── 2. Parent tanpa anak ───────────────────────────────────────────────
  console.log('=== Orang Tua Tanpa Anak ===');
  for (const parent of PARENTS_NO_CHILDREN) {
    const existing = await User.findOne({ email: parent.email });
    if (existing) {
      console.log(`↩  [parent] Sudah ada: ${parent.name}`);
      stats.parentSkipped++;
    } else {
      await User.create({
        ...parent,
        password:           defaultPasswordHash,
        role:               'parent',
        isActive:           true,
        emailVerified:      true,
        mustChangePassword: false,
      });
      console.log(`✅ [parent] Dibuat: ${parent.name}`);
      stats.parentCreated++;
    }
  }

  // ── Ringkasan ──────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════');
  console.log(`Parent dibuat   : ${stats.parentCreated}`);
  console.log(`Parent dilewati : ${stats.parentSkipped}  (email sudah ada)`);
  console.log(`Anak dibuat     : ${stats.childCreated}`);
  console.log(`Anak dilewati   : ${stats.childSkipped}  (sudah ada)`);
  console.log('════════════════════════════════');
  console.log('\nPassword default semua parent baru: Password123!');

  await mongoose.disconnect();
  console.log('Selesai ✔');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
