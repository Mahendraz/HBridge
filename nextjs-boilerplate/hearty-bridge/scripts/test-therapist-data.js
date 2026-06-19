const mongoose = require('mongoose');

// Simple schema for testing
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  profile: {
    specialization: [String],
    clinic: String,
    experience: Number
  }
}, { timestamps: true });

async function testTherapistData() {
  console.log('🔍 Testing Therapist Data...');
  
  try {
    // Try to connect to MongoDB
    console.log('🔗 Attempting to connect to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/hearty-bridge', {
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ Connected to MongoDB');
    
    const User = mongoose.model('User', userSchema);
    
    // Check if therapists exist
    const therapistCount = await User.countDocuments({ role: 'therapist', isActive: true });
    console.log(`📊 Found ${therapistCount} therapists in database`);
    
    if (therapistCount === 0) {
      console.log('⚠️ No therapists found! Creating sample data...');
      
      // Clear existing data first
      await User.deleteMany({ role: { $ne: 'admin' } });
      
      // Create sample therapists
      const therapists = [
        {
          name: 'Dr. Sari Wulandari, M.Psi',
          email: 'sari.wulandari@heartybridge.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'therapist',
          phone: '+6281234567890',
          profile: {
            specialization: ['Autisme', 'Terapi Perilaku ABA', 'Konseling Keluarga'],
            clinic: 'Hearty Bridge Center Jakarta',
            experience: 8
          }
        },
        {
          name: 'Budi Santoso, S.ST',
          email: 'budi.santoso@heartybridge.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'therapist',
          phone: '+6281234567891',
          profile: {
            specialization: ['Terapi Wicara', 'Keterlambatan Bicara'],
            clinic: 'Hearty Bridge Center Jakarta',
            experience: 6
          }
        },
        {
          name: 'Linda Maharani, S.Tr.OT',
          email: 'linda.maharani@heartybridge.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'therapist',
          phone: '+6281234567892',
          profile: {
            specialization: ['Terapi Okupasi', 'Integrasi Sensori'],
            clinic: 'Hearty Bridge Center Jakarta',
            experience: 5
          }
        },
        {
          name: 'Dr. Andi Permana, M.Psi',
          email: 'andi.permana@heartybridge.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'therapist',
          phone: '+6281234567893',
          profile: {
            specialization: ['ADHD', 'Terapi Kognitif'],
            clinic: 'Hearty Bridge Center Jakarta',
            experience: 10
          }
        }
      ];

      await User.insertMany(therapists);
      console.log(`✅ Created ${therapists.length} sample therapists`);
      
      // Also create an admin user for testing
      await User.create({
        name: 'Admin HeartyBridge',
        email: 'admin@heartybridge.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'admin',
        phone: '+6281234567894'
      });
      console.log('✅ Created admin user');
    }
    
    // Display all therapists
    const therapists = await User.find({ role: 'therapist', isActive: true }).select('-password');
    console.log('\n📋 Current Therapists:');
    therapists.forEach((therapist, index) => {
      console.log(`${index + 1}. ${therapist.name}`);
      console.log(`   Email: ${therapist.email}`);
      console.log(`   Specialization: ${therapist.profile?.specialization?.join(', ') || 'None'}`);
      console.log(`   Experience: ${therapist.profile?.experience || 0} years`);
      console.log(`   Created: ${therapist.createdAt}`);
      console.log('');
    });
    
    console.log('✅ Therapist data test completed successfully!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n💡 To fix this:');
    console.log('1. Install and start MongoDB:');
    console.log('   sudo apt update && sudo apt install mongodb');
    console.log('   sudo systemctl start mongodb');
    console.log('\n2. Or use Docker:');
    console.log('   docker run -d --name mongo -p 27017:27017 mongo:latest');
    console.log('\n3. Or use MongoDB Atlas (cloud)');
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testTherapistData();