import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromRequest,
  hasAnyRole,
  JWTPayload,
  verifyAccessToken
} from '@/lib/utils/jwt';
import type { UserRole } from '@/lib/types/auth';
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

// Routes a user with mustChangePassword may still call.
const PASSWORD_CHANGE_ALLOWED_PATHS = new Set(['/api/auth/me', '/api/auth/change-password']);

// Interface for middleware options
export interface AuthMiddlewareOptions {
  requireActive?: boolean;
  checkDatabase?: boolean;
  allowedRoles?: UserRole[];
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

      // Optional database verification
      if (options.checkDatabase || options.requireActive) {
        await connectToDatabase();

        const dbUser = await User.findById(user.userId).select('isActive email role tokenVersion mustChangePassword');

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

        // A password change/reset bumps tokenVersion, which kills every token
        // issued before it — including one that was stolen.
        if ((user.tv ?? 0) !== (dbUser.tokenVersion ?? 0)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Session is no longer valid. Please log in again.',
              code: 'TOKEN_REVOKED'
            },
            { status: 401 }
          );
        }

        // Update user data from database if checking
        user.email = dbUser.email;
        user.role = dbUser.role;

        // Until a temporary password is replaced, the account may only read
        // its own profile and change the password — enforced here, not just
        // by the client-side AuthGuard redirect.
        if (dbUser.mustChangePassword && !PASSWORD_CHANGE_ALLOWED_PATHS.has(request.nextUrl.pathname)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Password change required',
              code: 'PASSWORD_CHANGE_REQUIRED'
            },
            { status: 403 }
          );
        }
      }

      // Role gate runs on the role from the database when it was loaded, so a
      // demoted user's still-valid token no longer carries the old role.
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
    allowedRoles: ['therapist'],
    requireActive: true,
    checkDatabase: true
  });
}

/**
 * Middleware for parent-only routes
 */
export function withParentAuth(handler: AuthenticatedHandler) {
  return withAuth(handler, {
    allowedRoles: ['parent'],
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
 * IP-keyed rate limiting for routes that run BEFORE authentication exists
 * (login, register, change-password) — withRateLimit above wraps withAuth and
 * keys by user.userId, which doesn't work here since there's no user yet.
 */
export interface IpRateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window, per IP
  message?: string;
}

const ipRateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Number of reverse proxies in front of the app that append to
// X-Forwarded-For (1 = a single nginx/Vercel/Cloudflare hop).
const TRUSTED_PROXY_HOPS = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS || '1', 10) || 1);

export function getClientIp(request: NextRequest): string {
  // The client can put anything at the front of X-Forwarded-For, so the
  // leftmost entry can't be trusted. Each trusted proxy appends the address it
  // saw, so the client's real IP is TRUSTED_PROXY_HOPS entries from the right.
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const hops = forwardedFor.split(',').map((ip) => ip.trim()).filter(Boolean);
    const ip = hops[Math.max(0, hops.length - TRUSTED_PROXY_HOPS)];
    if (ip) return ip;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

/**
 * Failed-attempt counter keyed by something other than IP (e.g. the login
 * email), so brute-forcing one account is capped even when the attacker
 * rotates or spoofs IPs. In-memory: per server instance, like the limiters above.
 */
export function createFailureLimiter(options: { windowMs: number; maxFailures: number }) {
  const store = new Map<string, { count: number; resetTime: number }>();

  return {
    /** Seconds until the key may try again, or 0 when not blocked. */
    blockedFor(key: string): number {
      const record = store.get(key);
      if (!record) return 0;
      const now = Date.now();
      if (now > record.resetTime) {
        store.delete(key);
        return 0;
      }
      return record.count >= options.maxFailures ? Math.ceil((record.resetTime - now) / 1000) : 0;
    },
    recordFailure(key: string): void {
      const now = Date.now();
      const record = store.get(key);
      if (!record || now > record.resetTime) {
        store.set(key, { count: 1, resetTime: now + options.windowMs });
      } else {
        record.count++;
      }
    },
    reset(key: string): void {
      store.delete(key);
    },
  };
}

export function withIpRateLimit(options: IpRateLimitOptions) {
  return function (handler: UnauthenticatedHandler) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const key = getClientIp(request);
      const now = Date.now();
      const record = ipRateLimitStore.get(key);

      if (!record || now > record.resetTime) {
        ipRateLimitStore.set(key, {
          count: 1,
          resetTime: now + options.windowMs
        });
      } else if (record.count >= options.maxRequests) {
        return NextResponse.json(
          {
            success: false,
            error: options.message ?? 'Terlalu banyak percobaan. Coba lagi nanti.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((record.resetTime - now) / 1000)
          },
          { status: 429 }
        );
      } else {
        record.count++;
        ipRateLimitStore.set(key, record);
      }

      return await handler(request);
    };
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