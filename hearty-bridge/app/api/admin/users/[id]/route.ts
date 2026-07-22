import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAdminAuth } from '@/lib/middleware/auth';
import { ErrorResponse, SuccessResponse } from '@/lib/utils/error-handler';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  email: z.string().email('Email tidak valid').optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = withAdminAuth(async (request: NextRequest, { user }: any) => {
  await connectToDatabase();

  const url = new URL(request.url);
  const id = url.pathname.split('/').slice(-1)[0];

  const body = await request.json();
  const result = updateUserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(ErrorResponse.badRequest('Input tidak valid'));
  }

  const targetUser = await User.findById(id);
  if (!targetUser || targetUser.role === 'super_admin') {
    return NextResponse.json(ErrorResponse.notFound('User'));
  }

  const { name, email, phone, specialization, isActive } = result.data;

  if (name) targetUser.name = name.trim();
  if (email) {
    const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: targetUser._id } });
    if (emailExists) {
      return NextResponse.json(ErrorResponse.conflict('Email sudah digunakan'));
    }
    targetUser.email = email.toLowerCase().trim();
  }
  if (phone !== undefined) targetUser.phone = phone.trim() || undefined;
  if (isActive !== undefined) {
    if (targetUser._id.toString() === user.userId) {
      return NextResponse.json(ErrorResponse.badRequest('Tidak bisa menonaktifkan akun sendiri'));
    }
    targetUser.isActive = isActive;
  }
  if (specialization !== undefined && targetUser.role === 'therapist') {
    if (!targetUser.profile) targetUser.profile = {};
    targetUser.profile.specialization = specialization
      ? specialization.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];
    targetUser.markModified('profile');
  }

  await targetUser.save();

  return NextResponse.json(SuccessResponse.ok({ user: targetUser.toSafeObject() }, 'Berhasil diperbarui'));
});

export const DELETE = withAdminAuth(async (request: NextRequest, { user }: any) => {
  await connectToDatabase();

  const url = new URL(request.url);
  const id = url.pathname.split('/').slice(-1)[0];

  const targetUser = await User.findById(id);
  if (!targetUser || targetUser.role === 'super_admin') {
    return NextResponse.json(ErrorResponse.notFound('User'));
  }

  if (targetUser._id.toString() === user.userId) {
    return NextResponse.json(ErrorResponse.badRequest('Tidak bisa menghapus akun sendiri'));
  }

  targetUser.isActive = false;
  await targetUser.save();

  return NextResponse.json(SuccessResponse.ok({}, 'Terapis dinonaktifkan'));
});
