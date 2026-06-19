/**
 * Script to fix admin password that was double-hashed
 * Run with: node scripts/fix-admin-password.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017/hearty-bridge';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function fixAdminPassword() {
  try {
    console.log('🔧 Fixing admin password...\n');
    
    // Connect to database
    await connectToDatabase();
    
    // Hash the correct password
    const correctPassword = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(correctPassword, saltRounds);
    
    console.log('🔒 Generated new password hash:', hashedPassword);
    
    // Update admin user with correct password hash
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@heartybridge.com' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('❌ Admin user not found in database');
      console.log('\n📝 Please create admin user first:');
      
      const adminUser = {
        name: "Dr. Admin Utama",
        email: "admin@heartybridge.com",
        password: hashedPassword,
        role: "admin",
        phone: "+6281234567890",
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await mongoose.connection.db.collection('users').insertOne(adminUser);
      console.log('✅ Created new admin user:', insertResult.insertedId);
    } else {
      console.log('✅ Admin password updated successfully');
    }
    
    // Test the password
    console.log('\n🧪 Testing password verification...');
    const isValid = await bcrypt.compare('admin123', hashedPassword);
    console.log(isValid ? '✅ Password verification successful!' : '❌ Password verification failed!');
    
    console.log('\n🔑 Login credentials:');
    console.log('Email: admin@heartybridge.com');
    console.log('Password: admin123');
    console.log('\n✨ You can now login successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed');
    process.exit(0);
  }
}

// Run the fix script
fixAdminPassword();