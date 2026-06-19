/**
 * Script to populate MongoDB with initial data
 * Run this after starting MongoDB: node scripts/populate-mongodb.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Child = require('../models/Child');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Document = require('../models/Document');

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

// Sample data
const userData = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Dr. Sarah Johnson",
    email: "admin@heartybridge.com",
    password: "admin123", // Will be hashed
    role: "admin",
    phone: "+1-555-0101",
    profile: {
      specialization: ["System Administration", "Clinical Oversight"],
      clinic: "Hearty Bridge Center",
      experience: "15 years"
    }
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Dr. Michael Chen",
    email: "michael.chen@heartybridge.com",
    password: "therapist123", // Will be hashed
    role: "therapist",
    phone: "+1-555-0102",
    profile: {
      specialization: ["Autism Spectrum Disorders", "Behavioral Therapy"],
      clinic: "Hearty Bridge Center",
      experience: "8 years"
    }
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@heartybridge.com",
    password: "therapist123", // Will be hashed
    role: "therapist",
    phone: "+1-555-0103",
    profile: {
      specialization: ["Speech Therapy", "ADHD"],
      clinic: "Hearty Bridge Center",
      experience: "5 years"
    }
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "Jennifer Smith",
    email: "jennifer.smith@email.com",
    password: "parent123", // Will be hashed
    role: "parent",
    phone: "+1-555-0201",
    profile: {
      address: "123 Main St, Springfield",
      emergencyContact: {
        name: "Robert Smith",
        phone: "+1-555-0301",
        relation: "Spouse"
      }
    }
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: "David Wilson",
    email: "david.wilson@email.com",
    password: "parent123", // Will be hashed
    role: "parent",
    phone: "+1-555-0202",
    profile: {
      address: "456 Oak Ave, Springfield",
      emergencyContact: {
        name: "Lisa Wilson",
        phone: "+1-555-0302",
        relation: "Spouse"
      }
    }
  }
];

async function createUsers() {
  try {
    console.log('📝 Creating users...');
    
    // Clear existing users
    await User.deleteMany({});
    
    // Hash passwords and create users
    const usersToCreate = [];
    for (const user of userData) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      usersToCreate.push({
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const createdUsers = await User.insertMany(usersToCreate);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
}

async function createChildren(users) {
  try {
    console.log('📝 Creating children...');
    
    // Clear existing children
    await Child.deleteMany({});
    
    // Find parent and therapist users
    const parent1 = users.find(u => u.email === 'jennifer.smith@email.com');
    const parent2 = users.find(u => u.email === 'david.wilson@email.com');
    const therapist1 = users.find(u => u.email === 'michael.chen@heartybridge.com');
    const therapist2 = users.find(u => u.email === 'emily.rodriguez@heartybridge.com');
    
    const childrenData = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Emma Smith",
        dateOfBirth: new Date("2018-05-15"),
        gender: "female",
        parentId: parent1._id,
        therapistId: therapist1._id,
        medicalInfo: {
          conditions: ["Autism Spectrum Disorder"],
          allergies: ["None"],
          medications: ["None"],
          diagnosis: "Autism Spectrum Disorder - Level 1 Support"
        },
        emergencyContact: {
          name: "Jennifer Smith",
          phone: "+1-555-0201",
          relation: "Mother"
        },
        preferences: {
          therapyType: "Behavioral Therapy",
          goals: ["Improve social communication", "Reduce repetitive behaviors"],
          notes: "Responds well to visual cues and structured activities"
        },
        progress: {
          overallScore: 78,
          goals: [
            {
              area: "Communication",
              target: "Use 3-word phrases consistently",
              progress: 85,
              notes: "Significant improvement in verbal expression"
            },
            {
              area: "Social Skills", 
              target: "Initiate interaction with peers",
              progress: 65,
              notes: "Shows interest but needs encouragement"
            }
          ]
        },
        status: "active"
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Lucas Wilson",
        dateOfBirth: new Date("2019-08-22"),
        gender: "male",
        parentId: parent2._id,
        therapistId: therapist2._id,
        medicalInfo: {
          conditions: ["ADHD"],
          allergies: ["Peanuts"],
          medications: ["Concerta 18mg"],
          diagnosis: "ADHD - Combined Presentation"
        },
        emergencyContact: {
          name: "David Wilson",
          phone: "+1-555-0202",
          relation: "Father"
        },
        preferences: {
          therapyType: "Speech Therapy",
          goals: ["Improve attention span", "Better articulation"],
          notes: "Benefits from movement breaks and fidget tools"
        },
        progress: {
          overallScore: 65,
          goals: [
            {
              area: "Attention",
              target: "Sustain focus for 10 minutes",
              progress: 70,
              notes: "Improvement with structured activities"
            },
            {
              area: "Speech",
              target: "Clear pronunciation of 'r' sounds",
              progress: 60,
              notes: "Making steady progress with exercises"
            }
          ]
        },
        status: "active"
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Sophia Martinez",
        dateOfBirth: new Date("2017-12-03"),
        gender: "female",
        parentId: parent1._id,
        therapistId: null,
        medicalInfo: {
          conditions: ["Speech Delay"],
          allergies: ["None"],
          medications: ["None"],
          diagnosis: "Expressive Language Delay"
        },
        emergencyContact: {
          name: "Jennifer Smith",
          phone: "+1-555-0201",
          relation: "Guardian"
        },
        preferences: {
          therapyType: "Speech Therapy",
          goals: ["Expand vocabulary", "Form complete sentences"],
          notes: "Recently enrolled, awaiting therapist assignment"
        },
        progress: {
          overallScore: null,
          goals: []
        },
        status: "pending"
      }
    ];
    
    const createdChildren = await Child.insertMany(childrenData.map(child => ({
      ...child,
      createdAt: new Date(),
      updatedAt: new Date()
    })));
    
    console.log(`✅ Created ${createdChildren.length} children`);
    return createdChildren;
  } catch (error) {
    console.error('❌ Error creating children:', error);
    throw error;
  }
}

async function createConversations(users, children) {
  try {
    console.log('📝 Creating conversations...');
    
    // Clear existing conversations and messages
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    
    const parent1 = users.find(u => u.email === 'jennifer.smith@email.com');
    const therapist1 = users.find(u => u.email === 'michael.chen@heartybridge.com');
    const child1 = children.find(c => c.name === 'Emma Smith');
    
    // Create a conversation between parent and therapist
    const conversation = await Conversation.create({
      participants: [parent1._id, therapist1._id],
      childId: child1._id,
      subject: "Emma's Progress Discussion",
      lastMessage: new Date(),
      isActive: true
    });
    
    // Create some messages in the conversation
    const messages = await Message.create([
      {
        conversationId: conversation._id,
        senderId: parent1._id,
        content: "Hello Dr. Chen, I wanted to discuss Emma's recent progress.",
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        isRead: true
      },
      {
        conversationId: conversation._id,
        senderId: therapist1._id,
        content: "Hello Jennifer! I'm happy to discuss Emma's progress. She's been doing wonderfully in our sessions.",
        timestamp: new Date(Date.now() - 82800000), // 23 hours ago
        isRead: true
      },
      {
        conversationId: conversation._id,
        senderId: parent1._id,
        content: "That's great to hear! We've noticed improvements at home too.",
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        isRead: false
      }
    ]);
    
    console.log(`✅ Created 1 conversation with ${messages.length} messages`);
  } catch (error) {
    console.error('❌ Error creating conversations:', error);
    throw error;
  }
}

async function createDocuments(users, children) {
  try {
    console.log('📝 Creating documents...');
    
    // Clear existing documents
    await Document.deleteMany({});
    
    const therapist1 = users.find(u => u.email === 'michael.chen@heartybridge.com');
    const child1 = children.find(c => c.name === 'Emma Smith');
    
    const documents = await Document.create([
      {
        title: "Emma Smith - Initial Assessment Report",
        description: "Comprehensive initial evaluation and treatment plan",
        type: "assessment",
        fileName: "emma_initial_assessment.pdf",
        filePath: "/documents/assessments/emma_initial_assessment.pdf",
        fileSize: 1024000,
        mimeType: "application/pdf",
        uploadedBy: therapist1._id,
        childId: child1._id,
        tags: ["assessment", "initial", "autism"],
        isShared: true,
        sharedWith: [child1.parentId],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        metadata: {
          assessmentDate: new Date("2024-03-01"),
          assessor: "Dr. Michael Chen",
          summary: "Initial autism spectrum evaluation showing need for behavioral interventions"
        }
      },
      {
        title: "Monthly Progress Report - April 2024",
        description: "Emma's progress during April therapy sessions",
        type: "progress",
        fileName: "emma_progress_april_2024.pdf",
        filePath: "/documents/progress/emma_progress_april_2024.pdf",
        fileSize: 512000,
        mimeType: "application/pdf",
        uploadedBy: therapist1._id,
        childId: child1._id,
        tags: ["progress", "monthly", "april"],
        isShared: true,
        sharedWith: [child1.parentId],
        metadata: {
          reportPeriod: {
            start: new Date("2024-04-01"),
            end: new Date("2024-04-30")
          },
          sessionsCompleted: 8,
          progressScore: 78
        }
      }
    ]);
    
    console.log(`✅ Created ${documents.length} documents`);
  } catch (error) {
    console.error('❌ Error creating documents:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting MongoDB population...\n');
    
    await connectToDatabase();
    
    // Create users first
    const users = await createUsers();
    
    // Create children (depends on users)
    const children = await createChildren(users);
    
    // Create conversations (depends on users and children)
    await createConversations(users, children);
    
    // Create documents (depends on users and children)
    await createDocuments(users, children);
    
    console.log('\n🎉 MongoDB population completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`• Users: ${users.length} (1 admin, 2 therapists, 2 parents)`);
    console.log(`• Children: ${children.length} (2 active, 1 pending)`);
    console.log('• Conversations: 1 with 3 messages');
    console.log('• Documents: 2 (assessment + progress report)');
    
    console.log('\n🔑 Test login credentials:');
    console.log('Admin: admin@heartybridge.com / admin123');
    console.log('Therapist: michael.chen@heartybridge.com / therapist123');
    console.log('Parent: jennifer.smith@email.com / parent123');
    
  } catch (error) {
    console.error('❌ Population failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n📝 Database connection closed');
    process.exit(0);
  }
}

// Run the population script
main();