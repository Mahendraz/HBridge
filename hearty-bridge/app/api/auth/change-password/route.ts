import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAnyAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/utils/jwt';
import {
  ErrorResponse,
  SuccessResponse,
  handleValidationError,
} from '@/lib/utils/error-handler';
import { z } from 'zod';

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const POST = withAnyAuth(async (request: NextRequest, user: JWTPayload) => {
  await connectToDatabase();

  const body = await request.json();
  const result = changePasswordSchema.safeParse(body);

  if (!result.success) {
    return handleValidationError(result.error);
  }

  const { newPassword } = result.data;

  const dbUser = await User.findById(user.userId);
  if (!dbUser) {
    return ErrorResponse.notFound('User not found');
  }

  // Set new password — pre-save hook will hash it
  dbUser.password = newPassword;
  dbUser.mustChangePassword = false;
  await dbUser.save();

  return SuccessResponse.ok({ success: true }, 'Password changed successfully');
});

export async function GET() {
  return ErrorResponse.methodNotAllowed(['POST']);
}
