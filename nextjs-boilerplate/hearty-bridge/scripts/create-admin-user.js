/**
 * Script to create admin user with correct password hash
 * Run with: node scripts/create-admin-user.js
 */

const bcrypt = require('bcryptjs');

async function createAdminHash() {
  try {
    const password = 'admin123';
    const saltRounds = 12;
    
    console.log('🔒 Generating password hash for admin123...\n');
    
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Password hash generated successfully!\n');
    
    const adminUser = {
      "_id": "ObjectId()",
      "name": "Dr. Admin Utama",
      "email": "admin@heartybridge.com",
      "password": hash,
      "role": "admin",
      "phone": "+6281234567890",
      "isActive": true,
      "emailVerified": true,
      "createdAt": new Date(),
      "updatedAt": new Date()
    };
    
    console.log('📋 Admin user object to insert into MongoDB:\n');
    console.log(JSON.stringify(adminUser, null, 2));
    
    console.log('\n🔑 Login credentials:');
    console.log('Email: admin@heartybridge.com');
    console.log('Password: admin123');
    
    console.log('\n📝 To insert this user manually:');
    console.log('1. Open MongoDB Compass or mongo shell');
    console.log('2. Connect to database: hearty-bridge');
    console.log('3. Go to users collection');
    console.log('4. Insert the JSON object above');
    console.log('5. Remove quotes from "ObjectId()" and make it ObjectId()');
    
    // Test the hash
    console.log('\n🧪 Testing password verification...');
    const isValid = await bcrypt.compare('admin123', hash);
    console.log(isValid ? '✅ Password hash is correct!' : '❌ Password hash is incorrect!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdminHash();