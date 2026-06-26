import * as jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'therapist' | 'parent' | 'super_admin';
  name: string;
  iat?: number;
  exp?: number;
}

// Extended payload for refresh tokens
export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

// Helper to get JWT configuration
const getJWTConfig = () => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return {
    secret: JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  };
};

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const config = getJWTConfig();
    return jwt.sign(payload, config.secret, {
      expiresIn: config.expiresIn,
      issuer: 'hearty-bridge',
      audience: 'hearty-bridge-users'
    } as any);
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error}`);
  }
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string => {
  try {
    const config = getJWTConfig();
    return jwt.sign(payload, config.secret, {
      expiresIn: '30d',
      issuer: 'hearty-bridge',
      audience: 'hearty-bridge-users-refresh'
    } as any);
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${error}`);
  }
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const config = getJWTConfig();
    const decoded = jwt.verify(token, config.secret, {
      issuer: 'hearty-bridge',
      audience: 'hearty-bridge-users'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error(`Token verification failed: ${error}`);
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const config = getJWTConfig();
    const decoded = jwt.verify(token, config.secret, {
      issuer: 'hearty-bridge',
      audience: 'hearty-bridge-users-refresh'
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error(`Refresh token verification failed: ${error}`);
  }
};

/**
 * Extract token from request headers or cookies
 */
export const extractTokenFromRequest = (request: NextRequest): string | null => {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try to get token from cookies
  const cookieToken = request.cookies.get('access_token');
  if (cookieToken) {
    return cookieToken.value;
  }

  return null;
};

/**
 * Get user from token in request
 */
export const getUserFromRequest = (request: NextRequest): JWTPayload | null => {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return null;
    }

    return verifyAccessToken(token);
  } catch (error) {
    console.error('Failed to get user from request:', error);
    return null;
  }
};

/**
 * Set authentication cookies
 */
export const setAuthCookies = (
  response: NextResponse,
  accessToken: string,
  refreshToken?: string
): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Set access token cookie
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  });

  // Set refresh token cookie if provided
  if (refreshToken) {
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/api/auth'
    });
  }
};

/**
 * Clear authentication cookies
 */
export const clearAuthCookies = (response: NextResponse): void => {
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');
};

/**
 * Check if user has required role
 */
export const hasRole = (user: JWTPayload, requiredRole: 'admin' | 'therapist' | 'parent' | 'super_admin'): boolean => {
  return user.role === requiredRole;
};

/**
 * Check if user has any of the required roles
 */
export const hasAnyRole = (user: JWTPayload, requiredRoles: ('admin' | 'therapist' | 'parent' | 'super_admin')[]): boolean => {
  return requiredRoles.includes(user.role);
};

/**
 * Middleware helper to protect routes
 */
export const requireAuth = (
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse> | NextResponse
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = getUserFromRequest(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      return await handler(request, user);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
};

/**
 * Middleware helper to protect routes with role-based access
 */
export const requireRole = (
  requiredRole: 'therapist' | 'parent',
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse> | NextResponse
) => {
  return requireAuth(async (request: NextRequest, user: JWTPayload) => {
    if (!hasRole(user, requiredRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return await handler(request, user);
  });
};

/**
 * Middleware helper to protect routes with multiple allowed roles
 */
export const requireAnyRole = (
  requiredRoles: ('therapist' | 'parent')[],
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse> | NextResponse
) => {
  return requireAuth(async (request: NextRequest, user: JWTPayload) => {
    if (!hasAnyRole(user, requiredRoles)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return await handler(request, user);
  });
};

/**
 * Decode token without verification (for debugging purposes only)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = decodeToken(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    console.error('Failed to get token expiration:', error);
    return null;
  }
};

/**
 * Check if token is about to expire (within 5 minutes)
 */
export const isTokenNearExpiry = (token: string): boolean => {
  try {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return expiration <= fiveMinutesFromNow;
  } catch (error) {
    console.error('Failed to check token expiry:', error);
    return true;
  }
};