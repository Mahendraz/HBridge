import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAnyAuth } from '@/lib/middleware/auth';
import { JWTPayload, generateAccessToken } from '@/lib/utils/jwt';
import { commonValidations } from '@/lib/validation/auth';
import {
  ErrorResponse,
  SuccessResponse,
  handleValidationError,
  ErrorCodes,
} from '@/lib/utils/error-handler';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: commonValidations.password,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: 'Password baru harus berbeda dari password saat ini',
  path: ['newPassword'],
});

export const POST = withAnyAuth(async (request: NextRequest, user: JWTPayload) => {
  await connectToDatabase();

  const body = await request.json();
  const result = changePasswordSchema.safeParse(body);

  if (!result.success) {
    return handleValidationError(result.error);
  }

  const { currentPassword, newPassword } = result.data;

  const dbUser = await User.findById(user.userId);
  if (!dbUser) {
    return ErrorResponse.notFound('User not found');
  }

  // A stolen token alone must not be enough to take the account over.
  if (!(await dbUser.comparePassword(currentPassword))) {
    return ErrorResponse.unauthorized('Password saat ini salah', ErrorCodes.INVALID_CREDENTIALS);
  }

  // Set new password — pre-save hook will hash it
  dbUser.password = newPassword;
  dbUser.mustChangePassword = false;
  // Log out every other session holding a token from before this change.
  dbUser.tokenVersion = (dbUser.tokenVersion ?? 0) + 1;
  await dbUser.save();

  // This session's token was just revoked with the rest; hand it a new one.
  const token = generateAccessToken({
    userId: dbUser._id.toString(),
    email: dbUser.email,
    role: dbUser.role,
    name: dbUser.name,
    tv: dbUser.tokenVersion,
  });

  const response = SuccessResponse.ok({ success: true, token }, 'Password changed successfully');
  response.cookies.set('access_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
  return response;
});

export async function GET() {
  return ErrorResponse.methodNotAllowed(['POST']);
}
