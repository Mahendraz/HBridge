import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import Child from '@/models/Child';
import Session from '@/models/Session';
import { withAnyAuth } from '@/lib/middleware/auth';
import { 
  withErrorHandling, 
  ErrorResponse, 
  SuccessResponse,
  logRequest 
} from '@/lib/utils/error-handler';

export const GET = withAnyAuth(async (request: NextRequest, user: any) => {
  logRequest('GET', '/api/admin/stats');

  // Admin, super_admin, and therapist can access stats
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'therapist') {
    return ErrorResponse.forbidden("Access denied. Admin or therapist role required.");
  }

  try {
    await connectToDatabase();

    // Get user statistics
    const [totalUsers, totalTherapists, totalParents] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'therapist', isActive: true }),
      User.countDocuments({ role: 'parent', isActive: true })
    ]);

    // Get patient statistics
    const [totalPatients, activePatients, pendingPatients] = await Promise.all([
      Child.countDocuments(),
      Child.countDocuments({ status: 'active' }),
      Child.countDocuments({ status: 'pending' })
    ]);

    // Get recent activity stats
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt')
      .lean();

    // Get system health metrics (mock for now, could be real monitoring data)
    const systemHealth = {
      uptime: 99.7,
      responseTime: 120,
      errorRate: 0.1,
      activeConnections: 45
    };

    // Calculate growth metrics (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [recentUsersCount, previousUsersCount, recentPatientsCount, previousPatientsCount] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, isActive: true }),
      User.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, 
        isActive: true 
      }),
      Child.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Child.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      })
    ]);

    // Calculate growth percentages
    const userGrowth = previousUsersCount > 0 
      ? ((recentUsersCount - previousUsersCount) / previousUsersCount * 100).toFixed(1)
      : '100';
    
    const patientGrowth = previousPatientsCount > 0
      ? ((recentPatientsCount - previousPatientsCount) / previousPatientsCount * 100).toFixed(1)
      : '100';

    const stats = {
      users: {
        total: totalUsers,
        therapists: totalTherapists,
        parents: totalParents,
        growth: `+${userGrowth}%`
      },
      patients: {
        total: totalPatients,
        active: activePatients,
        pending: pendingPatients,
        growth: `+${patientGrowth}%`
      },
      system: {
        uptime: systemHealth.uptime,
        responseTime: systemHealth.responseTime,
        errorRate: systemHealth.errorRate,
        activeConnections: systemHealth.activeConnections
      },
      recentActivity: recentUsers.map(user => ({
        id: user._id.toString(),
        type: 'user_registration',
        title: `New ${user.role} registered`,
        description: `${user.name} (${user.email})`,
        timestamp: user.createdAt,
        priority: user.role === 'therapist' ? 'high' : 'medium'
      }))
    };

    return SuccessResponse.ok(stats, 'Admin statistics retrieved successfully');

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return ErrorResponse.internalServerError('Failed to fetch admin statistics');
  }
});