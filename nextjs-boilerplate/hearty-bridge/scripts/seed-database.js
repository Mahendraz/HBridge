const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const connectToDatabase = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/hearty-bridge');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['parent', 'therapist', 'admin'], required: true },
  phone: String,
  profile: {
    specialization: String,
    clinic: String,
    bio: String
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Child Schema
const childSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  medicalInfo: {
    conditions: [String],
    medications: [String],
    allergies: [String],
    notes: String
  },
  contactInfo: {
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Child = mongoose.models.Child || mongoose.model('Child', childSchema);

// Progress Schema
const progressSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  overallProgress: { type: Number, default: 0 },
  skillAreas: [{
    area: String,
    currentLevel: Number,
    targetLevel: Number,
    progress: Number
  }],
  milestones: [{
    title: String,
    description: String,
    achievedDate: Date,
    targetDate: Date,
    status: { type: String, enum: ['completed', 'in-progress', 'upcoming'], default: 'upcoming' }
  }],
  weeklyProgress: [{
    week: String,
    score: Number,
    sessions: Number,
    date: Date
  }]
}, { timestamps: true });

const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);

// Session Schema
const sessionSchema = new mongoose.Schema({
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  duration: { type: Number, default: 60 },
  type: { type: String, enum: ['in-person', 'video', 'phone'], default: 'in-person' },
  status: { type: String, enum: ['completed', 'scheduled', 'cancelled', 'no-show'], default: 'scheduled' },
  rating: Number,
  notes: String,
  goals: [String],
  nextSteps: String
}, { timestamps: true });

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Child.deleteMany({});
    await Progress.deleteMany({});
    await Session.deleteMany({});

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Create Users
    console.log('👥 Creating users...');
    const users = await User.insertMany([
      // Parents
      {
        name: 'Hendraz Parent',
        email: 'hendraz@parent.com',
        password: hashedPassword,
        role: 'parent',
        phone: '+1-555-0101'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@email.com',
        password: hashedPassword,
        role: 'parent',
        phone: '+1-555-0102'
      },
      {
        name: 'Michael Davis',
        email: 'michael.davis@email.com',
        password: hashedPassword,
        role: 'parent',
        phone: '+1-555-0103'
      },
      // Therapists
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@clinic.com',
        password: hashedPassword,
        role: 'therapist',
        phone: '+1-555-0201',
        profile: {
          specialization: 'Speech Therapy',
          clinic: 'Hearty Bridge Speech Center',
          bio: 'Licensed speech-language pathologist with 10+ years experience'
        }
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@clinic.com',
        password: hashedPassword,
        role: 'therapist',
        phone: '+1-555-0202',
        profile: {
          specialization: 'Occupational Therapy',
          clinic: 'Hearty Bridge Therapy Center',
          bio: 'Pediatric occupational therapist specializing in sensory processing'
        }
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@clinic.com',
        password: hashedPassword,
        role: 'therapist',
        phone: '+1-555-0203',
        profile: {
          specialization: 'Physical Therapy',
          clinic: 'Hearty Bridge Physical Therapy',
          bio: 'Physical therapist focused on pediatric motor development'
        }
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Get user IDs
    const hendrazParent = users.find(u => u.email === 'hendraz@parent.com');
    const sarahParent = users.find(u => u.email === 'sarah.wilson@email.com');
    const michaelParent = users.find(u => u.email === 'michael.davis@email.com');
    
    const drSarahTherapist = users.find(u => u.email === 'sarah.johnson@clinic.com');
    const drMichaelTherapist = users.find(u => u.email === 'michael.chen@clinic.com');
    const drEmilyTherapist = users.find(u => u.email === 'emily.rodriguez@clinic.com');

    // Create Children
    console.log('👶 Creating children...');
    const children = await Child.insertMany([
      {
        name: 'Emma Johnson',
        dateOfBirth: new Date('2017-03-15'),
        gender: 'female',
        parentId: hendrazParent._id,
        therapistId: drSarahTherapist._id,
        medicalInfo: {
          conditions: ['Mild speech delay'],
          medications: [],
          allergies: ['None known'],
          notes: 'Responds well to positive reinforcement'
        },
        contactInfo: {
          emergencyContact: {
            name: 'Grandma Johnson',
            phone: '+1-555-9001',
            relationship: 'Grandmother'
          }
        }
      },
      {
        name: 'Alex Chen',
        dateOfBirth: new Date('2019-07-22'),
        gender: 'male',
        parentId: hendrazParent._id,
        therapistId: drMichaelTherapist._id,
        medicalInfo: {
          conditions: ['Sensory processing disorder'],
          medications: [],
          allergies: ['Peanuts'],
          notes: 'Enjoys sensory activities, responds well to structure'
        },
        contactInfo: {
          emergencyContact: {
            name: 'Uncle David',
            phone: '+1-555-9002',
            relationship: 'Uncle'
          }
        }
      },
      {
        name: 'Lily Wilson',
        dateOfBirth: new Date('2018-11-08'),
        gender: 'female',
        parentId: sarahParent._id,
        therapistId: drSarahTherapist._id,
        medicalInfo: {
          conditions: ['Autism spectrum disorder'],
          medications: [],
          allergies: ['Dairy'],
          notes: 'Loves routine, excellent visual learner'
        },
        contactInfo: {
          emergencyContact: {
            name: 'Aunt Jenny',
            phone: '+1-555-9003',
            relationship: 'Aunt'
          }
        }
      },
      {
        name: 'Noah Davis',
        dateOfBirth: new Date('2020-01-30'),
        gender: 'male',
        parentId: michaelParent._id,
        therapistId: drEmilyTherapist._id,
        medicalInfo: {
          conditions: ['Cerebral palsy'],
          medications: ['Baclofen'],
          allergies: ['None'],
          notes: 'Making great progress with mobility goals'
        },
        contactInfo: {
          emergencyContact: {
            name: 'Grandpa Davis',
            phone: '+1-555-9004',
            relationship: 'Grandfather'
          }
        }
      }
    ]);

    console.log(`✅ Created ${children.length} children`);

    // Create Progress Records
    console.log('📈 Creating progress records...');
    const progressRecords = [];
    
    for (const child of children) {
      let skillAreas, milestones, overallProgress;
      
      if (child.name === 'Emma Johnson') {
        skillAreas = [
          { area: 'Speech Clarity', currentLevel: 85, targetLevel: 95, progress: 85 },
          { area: 'Social Interaction', currentLevel: 75, targetLevel: 90, progress: 75 },
          { area: 'Reading Skills', currentLevel: 70, targetLevel: 85, progress: 70 },
          { area: 'Confidence', currentLevel: 80, targetLevel: 90, progress: 80 }
        ];
        milestones = [
          {
            title: 'Clear Speech Sounds',
            description: 'Pronounce \'r\' and \'l\' sounds correctly in conversation',
            achievedDate: new Date('2024-04-15'),
            targetDate: new Date('2024-04-30'),
            status: 'completed'
          },
          {
            title: 'Social Confidence',
            description: 'Participate in group activities without prompting',
            targetDate: new Date('2024-05-15'),
            status: 'in-progress'
          }
        ];
        overallProgress = 85;
      } else if (child.name === 'Alex Chen') {
        skillAreas = [
          { area: 'Sensory Processing', currentLevel: 92, targetLevel: 95, progress: 92 },
          { area: 'Fine Motor Skills', currentLevel: 88, targetLevel: 95, progress: 88 },
          { area: 'Social Skills', currentLevel: 85, targetLevel: 90, progress: 85 },
          { area: 'Focus & Attention', currentLevel: 90, targetLevel: 95, progress: 90 }
        ];
        milestones = [
          {
            title: 'Sensory Regulation',
            description: 'Use sensory breaks effectively to self-regulate',
            achievedDate: new Date('2024-04-10'),
            targetDate: new Date('2024-04-15'),
            status: 'completed'
          }
        ];
        overallProgress = 92;
      } else {
        skillAreas = [
          { area: 'Communication', currentLevel: 70, targetLevel: 85, progress: 70 },
          { area: 'Social Skills', currentLevel: 65, targetLevel: 80, progress: 65 },
          { area: 'Adaptive Behavior', currentLevel: 75, targetLevel: 85, progress: 75 }
        ];
        milestones = [
          {
            title: 'Basic Communication',
            description: 'Use gestures and simple words to communicate needs',
            targetDate: new Date('2024-06-01'),
            status: 'in-progress'
          }
        ];
        overallProgress = Math.floor(Math.random() * 30) + 60; // 60-90%
      }

      progressRecords.push({
        childId: child._id,
        therapistId: child.therapistId,
        overallProgress,
        skillAreas,
        milestones,
        weeklyProgress: [
          { week: 'Week 1', score: overallProgress - 20, sessions: 2, date: new Date('2024-04-01') },
          { week: 'Week 2', score: overallProgress - 15, sessions: 2, date: new Date('2024-04-08') },
          { week: 'Week 3', score: overallProgress - 10, sessions: 2, date: new Date('2024-04-15') },
          { week: 'Week 4', score: overallProgress - 5, sessions: 2, date: new Date('2024-04-22') },
          { week: 'Week 5', score: overallProgress, sessions: 2, date: new Date('2024-04-29') }
        ]
      });
    }

    await Progress.insertMany(progressRecords);
    console.log(`✅ Created ${progressRecords.length} progress records`);

    // Create Session Records
    console.log('📅 Creating session records...');
    const sessionRecords = [];
    const statuses = ['completed', 'scheduled'];
    const sessionNotes = [
      'Excellent progress today. Student engaged and focused throughout the session.',
      'Good session with steady improvement. Continue with current exercises.',
      'Some challenges today but overall positive progress noted.',
      'Outstanding session! Major breakthrough achieved.',
      'Consistent effort shown. Building confidence week by week.'
    ];

    for (const child of children) {
      // Create 8 sessions per child (5 completed, 3 upcoming)
      for (let i = 0; i < 8; i++) {
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - (8 - i) * 3); // Sessions every 3 days
        
        const isCompleted = i < 5;
        const hour = 14 + (i % 3); // 2 PM, 3 PM, or 4 PM
        
        sessionRecords.push({
          childId: child._id,
          therapistId: child.therapistId,
          date: sessionDate,
          time: `${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
          duration: 60,
          type: ['in-person', 'video', 'in-person'][i % 3],
          status: isCompleted ? 'completed' : 'scheduled',
          rating: isCompleted ? Math.floor(Math.random() * 2) + 4 : undefined, // 4 or 5 stars
          notes: isCompleted ? sessionNotes[i % sessionNotes.length] : undefined,
          goals: isCompleted ? ['Practice target skills', 'Build confidence', 'Maintain progress'] : ['Continue current goals'],
          nextSteps: isCompleted ? 'Continue with current approach and add new challenges' : undefined
        });
      }
    }

    await Session.insertMany(sessionRecords);
    console.log(`✅ Created ${sessionRecords.length} session records`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👥 Users: ${users.length} (3 parents, 3 therapists)`);
    console.log(`   👶 Children: ${children.length}`);
    console.log(`   📈 Progress Records: ${progressRecords.length}`);
    console.log(`   📅 Session Records: ${sessionRecords.length}`);
    console.log('\n🔐 Test Accounts:');
    console.log('   Parent: hendraz@parent.com / password123');
    console.log('   Therapist: sarah.johnson@clinic.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
};

// Run the seed script
const main = async () => {
  await connectToDatabase();
  await seedData();
};

main().catch(console.error);