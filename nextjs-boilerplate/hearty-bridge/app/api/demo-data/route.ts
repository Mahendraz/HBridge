import { NextRequest, NextResponse } from 'next/server';
import { withAnyAuth } from '@/lib/middleware/auth';

// Demo data to simulate populated database
const demoTherapists = [
  {
    _id: 'demo_therapist_1',
    name: 'Dr. Michael Chen',
    email: 'michael.chen@heartybridge.com',
    phone: '+1-555-0123',
    specializations: ['Autism Spectrum Disorders', 'Behavioral Therapy'],
    status: 'active',
    assignedPatients: 2,
    maxPatients: 20,
    rating: 4.8,
    totalSessions: 342,
    joiningDate: new Date('2023-01-15').toISOString(),
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: { start: '09:00', end: '17:00' }
    },
    credentials: ['Licensed Clinical Social Worker', 'Board Certified Behavior Analyst'],
    clinic: 'Hearty Bridge Center',
    experience: 8
  },
  {
    _id: 'demo_therapist_2', 
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@heartybridge.com',
    phone: '+1-555-0124',
    specializations: ['Speech Therapy', 'ADHD', 'Occupational Therapy'],
    status: 'active',
    assignedPatients: 2,
    maxPatients: 20,
    rating: 4.9,
    totalSessions: 298,
    joiningDate: new Date('2023-03-20').toISOString(),
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: { start: '08:00', end: '16:00' }
    },
    credentials: ['Speech-Language Pathologist', 'ADHD Specialist'],
    clinic: 'Hearty Bridge Center',
    experience: 6
  }
];

const demoChildren = [
  {
    _id: 'demo_child_1',
    name: 'Emma Smith',
    age: 8,
    parentId: 'demo_parent_1',
    therapistId: 'demo_therapist_1',
    status: 'active',
    condition: 'Autism Spectrum Disorder',
    description: 'Emma is a bright 8-year-old who benefits from structured behavioral therapy.',
    createdAt: new Date('2023-06-15').toISOString()
  },
  {
    _id: 'demo_child_2',
    name: 'Lucas Wilson', 
    age: 6,
    parentId: 'demo_parent_2',
    therapistId: 'demo_therapist_2',
    status: 'active',
    condition: 'ADHD',
    description: 'Lucas is an energetic 6-year-old working on attention and focus skills.',
    createdAt: new Date('2023-07-10').toISOString()
  },
  {
    _id: 'demo_child_3',
    name: 'Sophia Johnson',
    age: 5,
    parentId: 'demo_parent_3', 
    therapistId: null,
    status: 'active',
    condition: 'Speech Delay',
    description: 'Sophia is developing her communication skills and shows great progress.',
    createdAt: new Date('2023-08-05').toISOString()
  },
  {
    _id: 'demo_child_4',
    name: 'Oliver Smith',
    age: 4,
    parentId: 'demo_parent_1',
    therapistId: null,
    status: 'active', 
    condition: 'Developmental Delay',
    description: 'Oliver is working on motor skills and social development.',
    createdAt: new Date('2023-09-20').toISOString()
  }
];

export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    switch (type) {
      case 'therapists':
        return NextResponse.json({
          success: true,
          data: {
            therapists: demoTherapists,
            total: demoTherapists.length,
            active: demoTherapists.filter(t => t.status === 'active').length,
            avgCaseload: Math.round(
              demoTherapists.reduce((acc, t) => acc + t.assignedPatients, 0) / demoTherapists.length
            ),
            avgRating: (
              demoTherapists.reduce((acc, t) => acc + t.rating, 0) / demoTherapists.length
            ).toFixed(1)
          },
          message: 'Demo therapists data retrieved successfully'
        });

      case 'children':
        return NextResponse.json({
          success: true,
          data: {
            children: demoChildren,
            pagination: {
              total: demoChildren.length,
              page: 1,
              pages: 1,
              limit: 50
            }
          },
          message: 'Demo children data retrieved successfully'
        });

      case 'stats':
        const totalUsers = 1 + demoTherapists.length + 3; // admin + therapists + parents
        return NextResponse.json({
          success: true,
          data: {
            users: {
              total: totalUsers,
              therapists: demoTherapists.length,
              parents: 3,
              growth: '+15%'
            },
            patients: {
              total: demoChildren.length,
              active: demoChildren.filter(c => c.status === 'active').length,
              assigned: demoChildren.filter(c => c.therapistId).length,
              growth: '+12%'
            },
            system: {
              uptime: 99.8,
              responseTime: 95,
              errorRate: 0.05,
              activeConnections: 28
            }
          },
          message: 'Demo admin stats retrieved successfully'
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid demo data type requested'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error serving demo data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to serve demo data'
    }, { status: 500 });
  }
});