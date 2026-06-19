import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { isConnected } from '@/lib/db/mongodb';
import { createHealthCheck, withErrorHandling, SuccessResponse } from '@/lib/utils/error-handler';

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Basic health check
  const health = {
    status: 'healthy',
    service: 'hearty-bridge-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      memory: 'healthy',
      environment: 'healthy'
    }
  };

  // Check database connectivity
  try {
    if (isConnected()) {
      health.checks.database = 'healthy';
    } else {
      await connectToDatabase();
      health.checks.database = 'healthy';
    }
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };

  // Simple memory threshold check (500MB for heap)
  if (memUsageMB.heapUsed > 500) {
    health.checks.memory = 'warning';
    health.status = 'degraded';
  }

  // Check required environment variables
  const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    health.checks.environment = 'unhealthy';
    health.status = 'unhealthy';
  }

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  return NextResponse.json({
    success: health.status !== 'unhealthy',
    ...health,
    memory: memUsageMB,
    missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined
  }, { status: statusCode });
});

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}