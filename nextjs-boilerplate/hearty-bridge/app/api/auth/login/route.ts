import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { generateAccessToken } from '@/lib/utils/jwt';
import { loginSchema } from '@/lib/validation/auth';
import { 
  withErrorHandling, 
  ErrorResponse, 
  SuccessResponse, 
  handleValidationError, 
  logRequest,
  ErrorCodes
} from '@/lib/utils/error-handler';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Log the request
  logRequest('POST', '/api/auth/login');

  // Connect to database
  await connectToDatabase();

  // Parse and validate request body
  const body = await request.json();
  
  const validationResult = loginSchema.safeParse(body);
  if (!validationResult.success) {
    return handleValidationError(validationResult.error);
  }

  const { email, password, rememberMe } = validationResult.data;

  // Find user by email
  const user = await User.findByEmail(email);
  
  if (!user) {
    // Don't reveal whether user exists or not for security
    return ErrorResponse.unauthorized("Invalid email or password", ErrorCodes.INVALID_CREDENTIALS);
  }

  // Check if user is active
  if (!user.isActive) {
    return ErrorResponse.unauthorized("Account has been deactivated. Please contact support.", ErrorCodes.ACCOUNT_DEACTIVATED);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return ErrorResponse.unauthorized("Invalid email or password", ErrorCodes.INVALID_CREDENTIALS);
  }

  // Generate JWT token
  const token = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name
  });

  // Get safe user object (without password)
  const safeUser = user.toSafeObject();

  // Update last login timestamp (optional - requires adding lastLogin field to User model)
  user.set({ lastLogin: new Date() });
  await user.save();

  // Create response
  const response = SuccessResponse.ok(
    {
      user: safeUser,
      token
    },
    "Login successful"
  );

  // Set authentication cookies with appropriate maxAge
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
  const isProduction = process.env.NODE_ENV === 'production';
  
  response.cookies.set('access_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge,
    path: '/'
  });

  // Log successful login
  logRequest('POST', '/api/auth/login', {
    id: user._id.toString(),
    email: user.email,
    role: user.role
  });

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