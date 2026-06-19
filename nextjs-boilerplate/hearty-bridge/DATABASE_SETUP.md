# Database Setup Instructions

## MongoDB Setup & Data Population

### 1. Install MongoDB

**Option A: Using Docker (Recommended)**
```bash
# Start MongoDB container
docker run -d --name hearty-bridge-mongo -p 27017:27017 mongo:latest

# Check if running
docker ps
```

**Option B: Install MongoDB Locally**

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download and install from https://www.mongodb.com/try/download/community

### 2. Verify MongoDB is Running

```bash
# Test connection
mongosh --host localhost:27017

# Or check if port is open
nc -z localhost 27017
```

### 3. Populate Database with Sample Data

```bash
# Navigate to project directory
cd /mnt/e/Work/Hendra/HBridge/nextjs-boilerplate/hearty-bridge

# Install dependencies (if not done)
npm install

# Run population script
node scripts/populate-mongodb.js
```

### 4. Expected Output

```
🚀 Starting MongoDB population...

✅ Connected to MongoDB
📝 Creating users...
✅ Created 5 users
📝 Creating children...
✅ Created 3 children
📝 Creating conversations...
✅ Created 1 conversation with 3 messages
📝 Creating documents...
✅ Created 2 documents

🎉 MongoDB population completed successfully!

📋 Summary:
• Users: 5 (1 admin, 2 therapists, 2 parents)
• Children: 3 (2 active, 1 pending)
• Conversations: 1 with 3 messages
• Documents: 2 (assessment + progress report)

🔑 Test login credentials:
Admin: admin@heartybridge.com / admin123
Therapist: michael.chen@heartybridge.com / therapist123
Parent: jennifer.smith@email.com / parent123
```

## Database Collections Created

### Users Collection
- **1 Admin**: Dr. Sarah Johnson
- **2 Therapists**: Dr. Michael Chen, Dr. Emily Rodriguez  
- **2 Parents**: Jennifer Smith, David Wilson

### Children Collection
- **Emma Smith** (Age 6) - Autism Spectrum Disorder - Assigned to Dr. Chen - Active
- **Lucas Wilson** (Age 5) - ADHD - Assigned to Dr. Rodriguez - Active
- **Sophia Martinez** (Age 7) - Speech Delay - Unassigned - Pending

### Conversations Collection
- Parent-Therapist discussion about Emma's progress

### Documents Collection
- Initial assessment report for Emma
- Monthly progress report for Emma

## Testing the Data

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Login with test accounts:**
   - **Admin**: `admin@heartybridge.com` / `admin123`
     - Can see all patients, therapists, full analytics
   - **Therapist**: `michael.chen@heartybridge.com` / `therapist123`
     - Can see assigned patients (Emma Smith)
   - **Parent**: `jennifer.smith@email.com` / `parent123`
     - Can see own children (Emma Smith, Sophia Martinez)

3. **Navigate to different pages:**
   - `/dashboard` - Role-specific dashboard
   - `/dashboard/patients` - Patient management (filtered by role)
   - `/dashboard/therapists` - Therapist management (admin only)
   - `/dashboard/reports` - Progress reports (role-filtered)
   - `/dashboard/schedules` - Appointment scheduling

## Troubleshooting

### MongoDB Connection Issues

1. **Port 27017 not accessible:**
   ```bash
   # Check if MongoDB is running
   sudo systemctl status mongod
   
   # Start if not running
   sudo systemctl start mongod
   ```

2. **Permission denied errors:**
   ```bash
   # Fix MongoDB permissions
   sudo chown -R mongodb:mongodb /var/lib/mongodb
   sudo chown mongodb:mongodb /tmp/mongodb-27017.sock
   ```

3. **Docker issues:**
   ```bash
   # Remove and recreate container
   docker stop hearty-bridge-mongo
   docker rm hearty-bridge-mongo
   docker run -d --name hearty-bridge-mongo -p 27017:27017 mongo:latest
   ```

### Population Script Issues

1. **Module not found errors:**
   ```bash
   # Install dependencies
   npm install mongoose bcryptjs
   ```

2. **Connection timeout:**
   - Ensure MongoDB is running on localhost:27017
   - Check firewall settings
   - Verify MONGODB_URI in .env.local

3. **Re-run population:**
   ```bash
   # Clear database and repopulate
   mongosh hearty-bridge --eval "db.dropDatabase()"
   node scripts/populate-mongodb.js
   ```

## Environment Configuration

Ensure your `.env.local` has:
```
MONGODB_URI=mongodb://localhost:27017/hearty-bridge
JWT_SECRET=dev-jwt-secret-key-change-in-production-12345678901234567890
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Data Relationships

- **Parents** can see their own **Children**
- **Therapists** can see **Children** assigned to them
- **Admin** can see all data
- **Conversations** link Parents and Therapists about specific Children
- **Documents** are attached to Children and shared with Parents

The data is structured with proper relationships and role-based access controls that match the unified permission system.