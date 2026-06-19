import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, getUserFromRequest } from '@/lib/utils/jwt';
import { 
  withErrorHandling, 
  ErrorResponse, 
  SuccessResponse, 
  logRequest 
} from '@/lib/utils/error-handler';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get current user from token (optional - for logging purposes)
  const currentUser = getUserFromRequest(request);
  
  if (currentUser) {
    logRequest('POST', '/api/auth/logout', {
      id: currentUser.userId,
      email: currentUser.email,
      role: currentUser.role
    });
  } else {
    logRequest('POST', '/api/auth/logout');
  }

  // Create response - always succeed for logout to ensure client state is cleared
  const response = SuccessResponse.ok({}, "Logged out successfully");

  // Clear authentication cookies
  clearAuthCookies(response);

  return response;
});

// Handle unsupported methods
export async function GET() {
  return ErrorResponse.methodNotAllowed(['POST']);
}

export async function PUT() {
  return ErrorResponse.methodNotAllowed(['POST']);
}

export async function DELETE() {
  return ErrorResponse.methodNotAllowed(['POST']);
}