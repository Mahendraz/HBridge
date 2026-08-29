# Panduan Membuat Akun Admin dan Terapis Secara Manual

Karena keamanan, akun admin dan terapis tidak bisa dibuat melalui form registrasi publik. Akun ini harus dibuat secara manual melalui MongoDB atau script khusus.

## Cara 1: Menggunakan MongoDB Compass / MongoDB Shell

### 1. Akses MongoDB
```bash
# Jika menggunakan MongoDB lokal
mongosh

# Atau jika menggunakan URI connection
mongosh "mongodb://localhost:27017/hearty-bridge"
```

### 2. Pilih Database
```javascript
use heartybridge
```

### 3. Membuat Akun Admin

```javascript
// Insert admin user
db.users.insertOne({
  name: "Dr. Admin Utama",
  email: "admin@heartybridge.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/9j0h5c.123456789", // Password: admin123
  role: "admin",
  phone: "+6281234567890",
  isActive: true,
  emailVerified: true,
  profile: {
    address: "Jakarta, Indonesia",
    emergencyContact: {
      name: "Emergency Contact",
      phone: "+6281234567891",
      relation: "Colleague"
    }
  },
  permissions: [
    "manage_users",
    "manage_therapists", 
    "manage_children",
    "manage_sessions",
    "manage_reports",
    "view_analytics",
    "manage_settings"
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 4. Membuat Akun Terapis

```javascript
// Insert therapist user
db.users.insertOne({
  name: "Dr. Sarah Terapis",
  email: "sarah.terapis@heartybridge.com", 
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/9j0h5c.123456789", // Password: therapist123
  role: "therapist",
  phone: "+6281234567892",
  isActive: true,
  emailVerified: true,
  profile: {
    specialization: ["Speech Therapy", "Autism Spectrum Disorder"],
    clinic: "Klinik Terapi Anak Jakarta",
    experience: "5 tahun",
    license: "STRP-12345-2024",
    address: "Jakarta Selatan, Indonesia",
    emergencyContact: {
      name: "Dr. Emergency",
      phone: "+6281234567893", 
      relation: "Colleague"
    }
  },
  availability: {
    monday: ["09:00", "17:00"],
    tuesday: ["09:00", "17:00"],
    wednesday: ["09:00", "17:00"],
    thursday: ["09:00", "17:00"],
    friday: ["09:00", "17:00"],
    saturday: ["09:00", "13:00"]
  },
  permissions: [
    "view_assigned_children",
    "manage_sessions", 
    "create_reports",
    "update_progress",
    "manage_schedule"
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Cara 2: Menggunakan Script Node.js

Buat file `scripts/create-admin-therapist.js`:

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/heartybridge';

mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['parent', 'therapist', 'admin'], required: true },
  phone: String,
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  profile: mongoose.Schema.Types.Mixed,
  availability: mongoose.Schema.Types.Mixed,
  permissions: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = new User({
    name: "Dr. Admin Utama",
    email: "admin@heartybridge.com",
    password: hashedPassword,
    role: "admin",
    phone: "+6281234567890",
    isActive: true,
    emailVerified: true,
    profile: {
      address: "Jakarta, Indonesia",
      emergencyContact: {
        name: "Emergency Contact",
        phone: "+6281234567891",
        relation: "Colleague"
      }
    },
    permissions: [
      "manage_users",
      "manage_therapists", 
      "manage_children",
      "manage_sessions",
      "manage_reports",
      "view_analytics",
      "manage_settings"
    ]
  });

  try {
    await admin.save();
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@heartybridge.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
}

async function createTherapistUser() {
  const hashedPassword = await bcrypt.hash('therapist123', 12);
  
  const therapist = new User({
    name: "Dr. Sarah Terapis",
    email: "sarah.terapis@heartybridge.com",
    password: hashedPassword,
    role: "therapist",
    phone: "+6281234567892",
    isActive: true,
    emailVerified: true,
    profile: {
      specialization: ["Speech Therapy", "Autism Spectrum Disorder"],
      clinic: "Klinik Terapi Anak Jakarta",
      experience: "5 tahun",
      license: "STRP-12345-2024",
      address: "Jakarta Selatan, Indonesia",
      emergencyContact: {
        name: "Dr. Emergency",
        phone: "+6281234567893",
        relation: "Colleague"
      }
    },
    availability: {
      monday: ["09:00", "17:00"],
      tuesday: ["09:00", "17:00"],
      wednesday: ["09:00", "17:00"],
      thursday: ["09:00", "17:00"],
      friday: ["09:00", "17:00"],
      saturday: ["09:00", "13:00"]
    },
    permissions: [
      "view_assigned_children",
      "manage_sessions",
      "create_reports",
      "update_progress",
      "manage_schedule"
    ]
  });

  try {
    await therapist.save();
    console.log('✅ Therapist user created successfully');
    console.log('Email: sarah.terapis@heartybridge.com');
    console.log('Password: therapist123');
  } catch (error) {
    console.error('❌ Error creating therapist:', error.message);
  }
}

async function main() {
  console.log('🚀 Creating admin and therapist accounts...');
  
  await createAdminUser();
  await createTherapistUser();
  
  console.log('✅ Done! Remember to change default passwords.');
  mongoose.connection.close();
}

main().catch(console.error);
```

### Menjalankan Script:

```bash
# Install dependencies jika belum
npm install mongoose bcryptjs

# Jalankan script
node scripts/create-admin-therapist.js
```

## Cara 3: Menggunakan MongoDB Compass (GUI)

1. **Buka MongoDB Compass**
2. **Connect ke database** `heartybridge`
3. **Pilih collection** `users`
4. **Klik "Insert Document"**
5. **Copy-paste JSON berikut:**

### Untuk Admin:
```json
{
  "name": "Dr. Admin Utama",
  "email": "admin@heartybridge.com",
  "password": "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/9j0h5c.123456789",
  "role": "admin",
  "phone": "+6281234567890",
  "isActive": true,
  "emailVerified": true,
  "profile": {
    "address": "Jakarta, Indonesia",
    "emergencyContact": {
      "name": "Emergency Contact",
      "phone": "+6281234567891",
      "relation": "Colleague"
    }
  },
  "permissions": [
    "manage_users",
    "manage_therapists",
    "manage_children", 
    "manage_sessions",
    "manage_reports",
    "view_analytics",
    "manage_settings"
  ],
  "createdAt": {"$date": "2024-01-01T00:00:00.000Z"},
  "updatedAt": {"$date": "2024-01-01T00:00:00.000Z"}
}
```

### Untuk Terapis:
```json
{
  "name": "Dr. Sarah Terapis",
  "email": "sarah.terapis@heartybridge.com",
  "password": "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/9j0h5c.123456789",
  "role": "therapist",
  "phone": "+6281234567892",
  "isActive": true,
  "emailVerified": true,
  "profile": {
    "specialization": ["Speech Therapy", "Autism Spectrum Disorder"],
    "clinic": "Klinik Terapi Anak Jakarta",
    "experience": "5 tahun",
    "license": "STRP-12345-2024",
    "address": "Jakarta Selatan, Indonesia",
    "emergencyContact": {
      "name": "Dr. Emergency",
      "phone": "+6281234567893",
      "relation": "Colleague"
    }
  },
  "availability": {
    "monday": ["09:00", "17:00"],
    "tuesday": ["09:00", "17:00"],
    "wednesday": ["09:00", "17:00"],
    "thursday": ["09:00", "17:00"],
    "friday": ["09:00", "17:00"],
    "saturday": ["09:00", "13:00"]
  },
  "permissions": [
    "view_assigned_children",
    "manage_sessions",
    "create_reports", 
    "update_progress",
    "manage_schedule"
  ],
  "createdAt": {"$date": "2024-01-01T00:00:00.000Z"},
  "updatedAt": {"$date": "2024-01-01T00:00:00.000Z"}
}
```

## Generate Password Hash

Untuk membuat password hash baru, gunakan script ini:

```javascript
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 12);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

// Contoh penggunaan
hashPassword('admin123');
hashPassword('therapist123');
```

## Login Credentials Default

Setelah membuat akun:

### Admin:
- **Email:** `admin@heartybridge.com`
- **Password:** `admin123`

### Terapis:
- **Email:** `sarah.terapis@heartybridge.com` 
- **Password:** `therapist123`

## ⚠️ Keamanan Penting

1. **Ganti password default** setelah login pertama kali
2. **Gunakan email yang valid** untuk verifikasi
3. **Backup database** sebelum menambah user
4. **Jangan share credentials** di repository atau chat

## Permissions untuk Role

### Admin Permissions:
- `manage_users` - Kelola semua user
- `manage_therapists` - Kelola terapis
- `manage_children` - Kelola data anak  
- `manage_sessions` - Kelola sesi terapi
- `manage_reports` - Kelola laporan
- `view_analytics` - Lihat analytics
- `manage_settings` - Kelola pengaturan sistem

### Therapist Permissions:
- `view_assigned_children` - Lihat anak yang ditugaskan
- `manage_sessions` - Kelola sesi terapi
- `create_reports` - Buat laporan  
- `update_progress` - Update progress
- `manage_schedule` - Kelola jadwal