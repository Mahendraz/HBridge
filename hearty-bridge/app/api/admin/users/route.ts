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
import { assignTherapistColor } from '@/lib/utils/therapist-colors';
import type { JWTPayload } from '@/lib/utils/jwt';
import { logActivity, roleLabel } from '@/lib/utils/audit-log';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['therapist', 'parent'], { message: 'Role must be therapist or parent' }),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  clinic: z.string().optional(),
  experience: z.number().optional(),
  // Therapist birth date (YYYY-MM-DD) — only honored for super_admin.
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir harus YYYY-MM-DD').nullable().optional(),
});

export const POST = withAdminAuth(async (request: NextRequest, user: JWTPayload) => {
  await connectToDatabase();

  const body = await request.json();
  const result = createUserSchema.safeParse(body);

  if (!result.success) {
    return handleValidationError(result.error);
  }

  const { name, email, password, role, phone, specialization, clinic, experience, dateOfBirth } = result.data;

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
    const existingTherapists = await User.find({ role: 'therapist' }).select('profile.color').lean();
    const usedColors = existingTherapists.map((t: any) => t.profile?.color);

    userData.profile = {
      specialization: specialization ? [specialization] : [],
      clinic: clinic?.trim(),
      experience,
      color: assignTherapistColor(usedColors),
      ...(dateOfBirth && user.role === 'super_admin' && { dateOfBirth: new Date(dateOfBirth + 'T00:00:00Z') }),
    };
  }

  const newUser = new User(userData);
  await newUser.save();

  const safeUser = newUser.toSafeObject();

  logActivity(request, {
    category: 'account',
    action: 'user.created',
    title: `${roleLabel(role)} baru terdaftar`,
    description: newUser.name,
    actor: user,
    target: { type: 'user', id: newUser._id, name: newUser.name },
    metadata: { role, email: newUser.email },
  });

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
