const mongoose = require('mongoose');

// Simple schema definitions for population
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: { type: Boolean, default: true },
  profile: {
    specialization: [String],
    clinic: String,
    experience: Number
  }
}, { timestamps: true });

const childSchema = new mongoose.Schema({
  name: String,
  age: Number,
  parentId: mongoose.Schema.Types.ObjectId,
  therapistId: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'active' },
  condition: String,
  description: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Child = mongoose.model('Child', childSchema);

async function populateData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/hearty-bridge');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({ role: { $ne: 'admin' } });
    await Child.deleteMany({});

    // Create therapists
    console.log('👨‍⚕️ Creating therapists...');
    const therapist1 = await User.create({
      name: 'Dr. Sari Wulandari, M.Psi',
      email: 'sari.wulandari@heartybridge.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'therapist',
      profile: {
        specialization: ['Autisme', 'Terapi Perilaku ABA', 'Konseling Keluarga'],
        clinic: 'Hearty Bridge Center Jakarta',
        experience: 5
      }
    });

    const therapist2 = await User.create({
      name: 'Budi Santoso, S.ST',
      email: 'budi.santoso@heartybridge.com', 
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'therapist',
      profile: {
        specialization: ['Terapi Wicara', 'Keterlambatan Bicara'],
        clinic: 'Hearty Bridge Center Jakarta',
        experience: 7
      }
    });

    const therapist3 = await User.create({
      name: 'Linda Maharani, S.Tr.OT',
      email: 'linda.maharani@heartybridge.com', 
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'therapist',
      profile: {
        specialization: ['Terapi Okupasi', 'Integrasi Sensori'],
        clinic: 'Hearty Bridge Center Jakarta',
        experience: 4
      }
    });

    // Create parents
    console.log('👨‍👩‍👧‍👦 Creating parents...');
    const parent1 = await User.create({
      name: 'Ratna Prasetyo',
      email: 'ratna.prasetyo@gmail.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'parent'
    });

    const parent2 = await User.create({
      name: 'Dewi Salsabila',
      email: 'dewi.salsabila@gmail.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'parent'
    });

    const parent3 = await User.create({
      name: 'Bambang Mahardika',
      email: 'bambang.mahardika@gmail.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'parent'
    });

    // Create children
    console.log('👶 Creating children...');
    await Child.create({
      name: 'Emma Smith',
      age: 8,
      parentId: parent1._id,
      therapistId: therapist1._id,
      condition: 'Autism Spectrum Disorder',
      description: 'Emma is a bright 8-year-old who benefits from structured behavioral therapy.'
    });

    await Child.create({
      name: 'Lucas Wilson',
      age: 6,
      parentId: parent2._id,
      therapistId: therapist2._id,
      condition: 'ADHD',
      description: 'Lucas is an energetic 6-year-old working on attention and focus skills.'
    });

    await Child.create({
      name: 'Sophia Johnson',
      age: 5,
      parentId: parent3._id,
      condition: 'Speech Delay',
      description: 'Sophia is developing her communication skills and shows great progress.'
    });

    await Child.create({
      name: 'Oliver Smith',
      age: 4,
      parentId: parent1._id,
      condition: 'Developmental Delay',
      description: 'Oliver is working on motor skills and social development.'
    });

    console.log('✅ Data population completed!');
    console.log('📊 Summary:');
    console.log(`   - Therapists: ${await User.countDocuments({ role: 'therapist' })}`);
    console.log(`   - Parents: ${await User.countDocuments({ role: 'parent' })}`);
    console.log(`   - Children: ${await Child.countDocuments()}`);
    console.log(`   - Total Users: ${await User.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error populating data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

populateData();