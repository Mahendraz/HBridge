import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import Child from '@/models/Child';
import Session from '@/models/Session';
import Document from '@/models/Document';
import { withAnyAuth } from '@/lib/middleware/auth';
import { 
  withErrorHandling, 
  ErrorResponse, 
  SuccessResponse,
  logRequest 
} from '@/lib/utils/error-handler';

export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  logRequest('GET', '/api/admin/activity');

  // Check if user is admin
  if (user.role !== 'admin') {
    return ErrorResponse.forbidden("Access denied. Admin role required.");
  }

  try {
    await connectToDatabase();

    const activities = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent user registrations
    const recentUsers = await User.find({
      createdAt: { $gte: oneWeekAgo },
      isActive: true
    }).sort({ createdAt: -1 }).limit(10).lean();

    recentUsers.forEach(user => {
      const timeAgo = getTimeAgo(user.createdAt);
      activities.push({
        id: `user_${user._id}`,
        type: 'appointment', // Using existing type
        title: `New ${user.role} registered`,
        description: `${user.name} completed registration`,
        timestamp: timeAgo,
        priority: user.role === 'therapist' ? 'high' : 'medium'
      });
    });

    // Get recent patient registrations
    const recentPatients = await Child.find({
      createdAt: { $gte: oneWeekAgo }
    })
    .populate('parentId', 'name')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    recentPatients.forEach(patient => {
      const timeAgo = getTimeAgo(patient.createdAt);
      const parentName = (patient.parentId as any)?.name || 'parent';
      activities.push({
        id: `patient_${patient._id}`,
        type: 'session',
        title: 'New patient registered',
        description: `${patient.name} added by ${parentName}`,
        timestamp: timeAgo,
        priority: 'medium'
      });
    });

    // Get recent documents/reports
    const recentDocs = await Document.find({
      createdAt: { $gte: oneWeekAgo }
    })
    .populate('uploadedBy', 'name')
    .populate('childId', 'name')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    recentDocs.forEach(doc => {
      const timeAgo = getTimeAgo(doc.createdAt);
      const childName = (doc.childId as any)?.name || 'patient';
      activities.push({
        id: `doc_${doc._id}`,
        type: 'report',
        title: 'New document uploaded',
        description: `${doc.title} for ${childName}`,
        timestamp: timeAgo,
        priority: 'low'
      });
    });

    // Check for system alerts (therapist capacity)
    const therapistStats = await User.aggregate([
      { $match: { role: 'therapist', isActive: true } },
      {
        $lookup: {
          from: 'children',
          localField: '_id',
          foreignField: 'therapistId',
          as: 'assignedPatients'
        }
      },
      {
        $project: {
          name: 1,
          patientCount: { $size: '$assignedPatients' }
        }
      },
      { $match: { patientCount: { $gte: 5 } } } // Assuming 5+ is high capacity
    ]);

    if (therapistStats.length > 0) {
      activities.push({
        id: 'capacity_alert',
        type: 'session',
        title: 'High therapist capacity alert',
        description: `${therapistStats.length} therapists approaching capacity limits`,
        timestamp: '1 hour ago',
        priority: 'high'
      });
    }

    // Sort by priority and timestamp
    const sortedActivities = activities
      .sort((a, b) => {
        const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by timestamp (most recent first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, 15); // Limit to 15 most important activities

    return SuccessResponse.ok(sortedActivities, 'Recent activity retrieved successfully');

  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return ErrorResponse.internalServerError('Failed to fetch recent activity');
  }
});

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return '1 week ago';
  }
}