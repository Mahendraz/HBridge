import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAdminAuth } from '@/lib/middleware/auth';
import {
  ErrorResponse,
  SuccessResponse,
  handleValidationError,
  ErrorCodes,
} from '@/lib/utils/error-handler';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['therapist', 'parent'], { message: 'Role must be therapist or parent' }),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  clinic: z.string().optional(),
  experience: z.number().optional(),
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  await connectToDatabase();

  const body = await request.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return handleValidationError(result.error);
  }

  const { name, email, password, role, phone, specialization, clinic, experience } = result.data;

  const existing = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (existing) {
    return ErrorResponse.conflict('User with this email already exists', ErrorCodes.DUPLICATE_RESOURCE);
  }

  const userData: any = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    phone: phone?.trim(),
    mustChangePassword: true,
    isActive: true,
  };

  if (role === 'therapist') {
    userData.profile = {
      specialization: specialization ? [specialization] : [],
      clinic: clinic?.trim(),
      experience,
    };
  }

  const newUser = new User(userData);
  await newUser.save();

  const safeUser = newUser.toSafeObject();

  return SuccessResponse.created({ user: safeUser }, 'User created successfully');
});

export const GET = withAdminAuth(async (request: NextRequest) => {
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  const query: any = { isActive: true };
  if (role && ['therapist', 'parent', 'admin'].includes(role)) {
    query.role = role;
  }

  const users = await User.find(query).select('-password').sort({ name: 1 });
  return SuccessResponse.ok({ users: users.map((u) => u.toSafeObject()) });
});
