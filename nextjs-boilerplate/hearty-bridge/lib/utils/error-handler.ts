import { NextResponse } from 'next/server';
import { z } from 'zod';

// Error codes for consistent error handling
export const ErrorCodes = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  AUTH_FAILED: 'AUTH_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Business logic errors
  INVALID_OPERATION: 'INVALID_OPERATION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
} as const;

// Error interface
export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp?: string;
  path?: string;
}

// Error response builder
export class ErrorResponse {
  static badRequest(
    message: string = 'Bad Request',
    code: string = ErrorCodes.VALIDATION_ERROR,
    details?: any
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code,
      details,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }

  static unauthorized(
    message: string = 'Authentication required',
    code: string = ErrorCodes.AUTH_REQUIRED
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }

  static forbidden(
    message: string = 'Insufficient permissions',
    code: string = ErrorCodes.INSUFFICIENT_PERMISSIONS
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString()
    }, { status: 403 });
  }

  static notFound(
    message: string = 'Resource not found',
    code: string = ErrorCodes.RESOURCE_NOT_FOUND
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString()
    }, { status: 404 });
  }

  static conflict(
    message: string = 'Resource already exists',
    code: string = ErrorCodes.DUPLICATE_RESOURCE
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString()
    }, { status: 409 });
  }

  static tooManyRequests(
    message: string = 'Too many requests',
    code: string = ErrorCodes.RATE_LIMIT_EXCEEDED,
    retryAfter?: number
  ): NextResponse {
    const response = NextResponse.json({
      success: false,
      error: message,
      code,
      retryAfter,
      timestamp: new Date().toISOString()
    }, { status: 429 });

    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString());
    }

    return response;
  }

  static internalServerError(
    message: string = 'Internal server error',
    code: string = ErrorCodes.INTERNAL_SERVER_ERROR
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }

  static serviceUnavailable(
    message: string = 'Service temporarily unavailable',
    code: string = ErrorCodes.SERVICE_UNAVAILABLE
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: message,
      code,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }

  // Method not allowed
  static methodNotAllowed(allowedMethods: string[] = []): NextResponse {
    const response = NextResponse.json({
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods,
      timestamp: new Date().toISOString()
    }, { status: 405 });

    if (allowedMethods.length > 0) {
      response.headers.set('Allow', allowedMethods.join(', '));
    }

    return response;
  }
}

// Success response builder
export class SuccessResponse {
  static ok(data: any, message?: string): NextResponse {
    return NextResponse.json({
      success: true,
      message,
      ...data,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }

  static created(data: any, message?: string): NextResponse {
    return NextResponse.json({
      success: true,
      message,
      ...data,
      timestamp: new Date().toISOString()
    }, { status: 201 });
  }

  static accepted(message?: string): NextResponse {
    return NextResponse.json({
      success: true,
      message: message || 'Request accepted',
      timestamp: new Date().toISOString()
    }, { status: 202 });
  }

  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }
}

// Validation error handler
export function handleValidationError(error: z.ZodError): NextResponse {
  const details = error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }));

  return ErrorResponse.badRequest(
    'Validation failed',
    ErrorCodes.VALIDATION_ERROR,
    details
  );
}

// MongoDB error handler
export function handleMongoError(error: any): NextResponse {
  console.error('MongoDB error:', error);

  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return ErrorResponse.conflict(
      `${field} already exists`,
      ErrorCodes.DUPLICATE_RESOURCE
    );
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      kind: err.kind
    }));

    return ErrorResponse.badRequest(
      'Validation error',
      ErrorCodes.VALIDATION_ERROR,
      details
    );
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return ErrorResponse.badRequest(
      `Invalid ${error.path}: ${error.value}`,
      ErrorCodes.INVALID_REQUEST
    );
  }

  // Connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    return ErrorResponse.serviceUnavailable(
      'Database connection error',
      ErrorCodes.CONNECTION_ERROR
    );
  }

  // Generic database error
  return ErrorResponse.internalServerError(
    'Database error occurred',
    ErrorCodes.DATABASE_ERROR
  );
}

// JWT error handler
export function handleJWTError(error: Error): NextResponse {
  if (error.message === 'Token expired') {
    return ErrorResponse.unauthorized(
      'Token has expired',
      ErrorCodes.TOKEN_EXPIRED
    );
  }
  
  if (error.message === 'Invalid token') {
    return ErrorResponse.unauthorized(
      'Invalid authentication token',
      ErrorCodes.INVALID_TOKEN
    );
  }

  return ErrorResponse.unauthorized(
    'Authentication failed',
    ErrorCodes.AUTH_FAILED
  );
}

// Generic error handler with logging
export function handleError(
  error: unknown,
  context: string = 'Unknown'
): NextResponse {
  console.error(`Error in ${context}:`, error);

  // Handle known error types
  if (error instanceof z.ZodError) {
    return handleValidationError(error);
  }

  if (error instanceof Error) {
    // JWT errors
    if (error.message.includes('jwt') || error.message.includes('token')) {
      return handleJWTError(error);
    }

    // MongoDB errors
    if (error.name?.includes('Mongo') || (error as any).code) {
      return handleMongoError(error);
    }

    // Custom application errors
    if (error.message.includes('Authentication')) {
      return ErrorResponse.unauthorized(error.message, ErrorCodes.AUTH_FAILED);
    }

    if (error.message.includes('Permission')) {
      return ErrorResponse.forbidden(error.message, ErrorCodes.INSUFFICIENT_PERMISSIONS);
    }

    if (error.message.includes('Not found')) {
      return ErrorResponse.notFound(error.message, ErrorCodes.RESOURCE_NOT_FOUND);
    }
  }

  // Fallback to internal server error
  return ErrorResponse.internalServerError(
    process.env.NODE_ENV === 'development' 
      ? `Error in ${context}: ${error}`
      : 'An unexpected error occurred'
  );
}

// Async error wrapper for route handlers
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error, handler.name || 'API Handler');
    }
  };
}

// Request context logger
export function logRequest(
  method: string,
  path: string,
  userInfo?: { id: string; email: string; role: string }
): void {
  const timestamp = new Date().toISOString();
  const user = userInfo ? `${userInfo.email} (${userInfo.role})` : 'anonymous';
  
  console.log(`[${timestamp}] ${method} ${path} - User: ${user}`);
}

// Performance monitoring
export function withPerformanceMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  operationName: string
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      console.log(`[PERF] ${operationName} completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[PERF] ${operationName} failed after ${duration}ms:`, error);
      throw error;
    }
  };
}

// Health check utility
export function createHealthCheck() {
  return SuccessResponse.ok({
    status: 'healthy',
    service: 'hearty-bridge-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }, 'Service is healthy');
}

// Export alias for convenience
export const handleApiError = handleError;