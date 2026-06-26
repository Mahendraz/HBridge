/**
 * Create super_admin user in MongoDB.
 * Run from Windows PowerShell:
 *   node scripts\create-super-admin.js
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hearty-bridge';

const UserSchema = new mongoose.Schema(
  {
    name:              { type: String, required: true },
    email:             { type: String, required: true, unique: true, lowercase: true },
    password:          { type: String, required: true },
    role:              { type: String, required: true },
    phone:             { type: String },
    isActive:          { type: Boolean, default: true },
    emailVerified:     { type: Boolean, default: true },
    mustChangePassword:{ type: Boolean, default: false },
  },
  { timestamps: true, collection: 'users' }
);

const SUPER_ADMIN = {
  name:     'Super Admin',
  email:    'superadmin@heartybridge.com',
  password: 'SuperAdmin2024!',
  role:     'super_admin',
  phone:    '+6281234567891',
};

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', UserSchema);

  const existing = await User.findOne({ email: SUPER_ADMIN.email });
  if (existing) {
    console.log(`Super admin already exists: ${SUPER_ADMIN.email}`);
    await mongoose.disconnect();
    return;
  }

  const hash = await bcrypt.hash(SUPER_ADMIN.password, 12);
  const user = await User.create({ ...SUPER_ADMIN, password: hash });

  console.log(`Super admin created!`);
  console.log(`  Email   : ${SUPER_ADMIN.email}`);
  console.log(`  Password: ${SUPER_ADMIN.password}`);
  console.log(`  ID      : ${user._id}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
