import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserFromRequest, 
  hasRole, 
  hasAnyRole, 
  JWTPayload,
  verifyAccessToken 
} from '@/lib/utils/jwt';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';

// Type definitions for middleware handlers
export type AuthenticatedHandler = (
  request: NextRequest, 
  user: JWTPayload
) => Promise<NextResponse> | NextResponse;

export type UnauthenticatedHandler = (
  request: NextRequest
) => Promise<NextResponse> | NextResponse;

// Interface for middleware options
export interface AuthMiddlewareOptions {
  requireActive?: boolean;
  checkDatabase?: boolean;
  allowedRoles?: ('admin' | 'therapist' | 'parent' | 'super_admin')[];
  requiredRole?: 'admin' | 'therapist' | 'parent' | 'super_admin';
}

/**
 * Core authentication middleware
 * Validates JWT token and extracts user information
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract and verify user from request
      const user = getUserFromRequest(request);
      
      if (!user) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          },
          { status: 401 }
        );
      }

      // Check if user has required role
      if (options.requiredRole && !hasRole(user, options.requiredRole)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS'
          },
          { status: 403 }
        );
      }

      // Check if user has any of the allowed roles
      if (options.allowedRoles && !hasAnyRole(user, options.allowedRoles)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS'
          },
          { status: 403 }
        );
      }

      // Optional database verification
      if (options.checkDatabase || options.requireActive) {
        await connectToDatabase();
        
        const dbUser = await User.findById(user.userId).select('isActive email role');
        
        if (!dbUser) {
          return NextResponse.json(
            { 
              success: false,
              error: 'User not found',
              code: 'USER_NOT_FOUND'
            },
            { status: 404 }
          );
        }

        if (options.requireActive && !dbUser.isActive) {
          return NextResponse.json(
            { 
              success: false,
              error: 'Account has been deactivated',
              code: 'ACCOUNT_DEACTIVATED'
            },
            { status: 401 }
          );
        }

        // Update user data from database if checking
        user.email = dbUser.email;
        user.role = dbUser.role;
      }

      // Call the actual handler
      return await handler(request, user);

    } catch (error) {
      console.error('Authentication middleware error:', error);

      // Handle specific JWT errors
      if (error instanceof Error) {
        if (error.message === 'Token expired') {
          return NextResponse.json(
            { 
              success: false,
              error: 'Token has expired',
              code: 'TOKEN_EXPIRED'
            },
            { status: 401 }
          );
        }
        
        if (error.message === 'Invalid token') {
          return NextResponse.json(
            { 
              success: false,
              error: 'Invalid authentication token',
              code: 'INVALID_TOKEN'
            },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication failed',
          code: 'AUTH_FAILED'
        },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware for therapist-only routes
 */
export function withTherapistAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, {
    requiredRole: 'therapist',
    requireActive: true,
    checkDatabase: true
  });
}

/**
 * Middleware for parent-only routes
 */
export function withParentAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, {
    requiredRole: 'parent',
    requireActive: true,
    checkDatabase: true
  });
}

/**
 * Middleware for admin-only routes (also allows super_admin)
 */
export function withAdminAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, {
    allowedRoles: ['admin', 'super_admin'],
    requireActive: true,
    checkDatabase: true
  });
}

/**
 * Middleware for super_admin-only routes
 */
export function withSuperAdminAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, {
    allowedRoles: ['super_admin'],
    requireActive: true,
    checkDatabase: true
  });
}

/**
 * Middleware for any authenticated user
 */
export function withAnyAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, {
    allowedRoles: ['admin', 'therapist', 'parent', 'super_admin'],
    requireActive: true,
    checkDatabase: true
  });
}

/**
 * Optional authentication middleware
 * Passes user info if authenticated, null if not
 */
export function withOptionalAuth(
  handler: (request: NextRequest, user: JWTPayload | null) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = getUserFromRequest(request);
      return await handler(request, user);
    } catch (error) {
      // If authentication fails, pass null user
      return await handler(request, null);
    }
  };
}

/**
 * Rate limiting middleware helper
 */
export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (request: NextRequest, user?: JWTPayload) => string;
}

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(options: RateLimitOptions) {
  return function(handler: AuthenticatedHandler) {
    return withAuth(async (request: NextRequest, user: JWTPayload) => {
      const key = options.keyGenerator 
        ? options.keyGenerator(request, user)
        : user.userId;

      const now = Date.now();
      const record = rateLimitStore.get(key);

      if (!record || now > record.resetTime) {
        // Reset the counter
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + options.windowMs
        });
      } else if (record.count >= options.maxRequests) {
        // Rate limit exceeded
        return NextResponse.json(
          {
            success: false,
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
          },
          { status: 429 }
        );
      } else {
        // Increment counter
        record.count++;
        rateLimitStore.set(key, record);
      }

      return await handler(request, user);
    });
  };
}

/**
 * Request validation middleware
 */
export function withValidation<T>(
  schema: any, // Zod schema
  handler: (request: NextRequest, user: JWTPayload, validatedData: T) => Promise<NextResponse> | NextResponse
) {
  return withAuth(async (request: NextRequest, user: JWTPayload) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body) as T;
      
      return await handler(request, user, validatedData);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: (error as any).issues?.map((issue: any) => ({
              field: issue.path.join('.'),
              message: issue.message
            })) || []
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_REQUEST'
        },
        { status: 400 }
      );
    }
  });
}

/**
 * CORS middleware for API routes
 */
export function withCors(
  handler: UnauthenticatedHandler,
  options: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
  } = {}
) {
  const {
    origin = process.env.NEXT_PUBLIC_APP_URL || '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization']
  } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin[0] : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }

    const response = await handler(request);

    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin[0] : origin);
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));

    return response;
  };
}

/**
 * Logging middleware
 */
export function withLogging(
  handler: AuthenticatedHandler,
  options: {
    logRequests?: boolean;
    logResponses?: boolean;
    logLevel?: 'info' | 'warn' | 'error';
  } = {}
) {
  const { logRequests = true, logResponses = false, logLevel = 'info' } = options;

  return withAuth(async (request: NextRequest, user: JWTPayload) => {
    const startTime = Date.now();
    
    if (logRequests) {
      console[logLevel](`[${new Date().toISOString()}] ${request.method} ${request.url} - User: ${user.email} (${user.role})`);
    }

    const response = await handler(request, user);
    
    if (logResponses) {
      const duration = Date.now() - startTime;
      console[logLevel](`[${new Date().toISOString()}] Response: ${response.status} - Duration: ${duration}ms`);
    }

    return response;
  });
}