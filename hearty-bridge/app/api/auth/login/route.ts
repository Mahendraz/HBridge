import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { generateAccessToken } from '@/lib/utils/jwt';
import { loginSchema } from '@/lib/validation/auth';
import { withIpRateLimit, createFailureLimiter } from '@/lib/middleware/auth';
import * as bcrypt from 'bcryptjs';
import {
  withErrorHandling,
  ErrorResponse,
  SuccessResponse,
  handleValidationError,
  logRequest,
  ErrorCodes
} from '@/lib/utils/error-handler';

// 10 attempts per 15 minutes, per IP — blocks credential-stuffing/brute-force
// without meaningfully affecting a real user who mistypes their password a
// couple of times.
const loginRateLimit = withIpRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.',
});

// Per-account cap on failed passwords, independent of the caller's IP, so
// spreading guesses across many (or spoofed) IPs doesn't help.
const accountFailures = createFailureLimiter({ windowMs: 15 * 60 * 1000, maxFailures: 10 });

// bcrypt hash (cost 12) of a random string, compared against when the email
// doesn't exist so that case takes as long as a wrong password.
const DUMMY_PASSWORD_HASH = '$2b$12$kFf88OMkqyKJrr8uQCeHJeCUfbtxdB66iFmKX9V2sVf/UoDfOew6.';

export const POST = withErrorHandling(loginRateLimit(async (request: NextRequest) => {
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

  const retryAfter = accountFailures.blockedFor(email);
  if (retryAfter > 0) {
    return ErrorResponse.tooManyRequests(
      'Terlalu banyak percobaan login untuk akun ini. Coba lagi dalam beberapa menit.',
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      retryAfter
    );
  }

  // Find user by email (active accounts only)
  const user = await User.findByEmail(email);

  // Same work and same answer whether the account is missing, deactivated or
  // the password is wrong, so the response doesn't reveal which emails exist.
  const isPasswordValid = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

  if (!user || !isPasswordValid) {
    accountFailures.recordFailure(email);
    return ErrorResponse.unauthorized("Invalid email or password", ErrorCodes.INVALID_CREDENTIALS);
  }

  accountFailures.reset(email);

  // Generate JWT token
  const token = generateAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    tv: user.tokenVersion ?? 0
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
}));

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