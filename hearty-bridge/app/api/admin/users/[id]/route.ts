import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAdminAuth } from '@/lib/middleware/auth';
import { ErrorResponse, SuccessResponse } from '@/lib/utils/error-handler';
import { deleteParentAccount } from '@/lib/utils/account-deletion';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  email: z.string().email('Email tidak valid').optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  isActive: z.boolean().optional(),
  color: z.union([z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Warna harus format hex, cth. #14b8a6'), z.null()]).optional(),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  dateOfBirth: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir harus YYYY-MM-DD'), z.null()]).optional(),
});

export const PATCH = withAdminAuth(async (request: NextRequest, user: any) => {
  await connectToDatabase();

  const url = new URL(request.url);
  const id = url.pathname.split('/').slice(-1)[0];

  const body = await request.json();
  const result = updateUserSchema.safeParse(body);
  if (!result.success) {
    return ErrorResponse.badRequest('Input tidak valid');
  }

  const targetUser = await User.findById(id);
  if (!targetUser || targetUser.role === 'super_admin') {
    return ErrorResponse.notFound('User');
  }

  // Staff accounts at the same level are managed by super_admin only, so one
  // admin can't lock out, rename or re-email another.
  if (targetUser.role === 'admin' && user.role !== 'super_admin' && targetUser._id.toString() !== user.userId) {
    return ErrorResponse.forbidden('Hanya Super Admin yang dapat mengubah akun admin lain');
  }

  const { name, email, phone, specialization, isActive, color, address, dateOfBirth } = result.data;

  if (name) targetUser.name = name.trim();
  if (email) {
    const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: targetUser._id } });
    if (emailExists) {
      return ErrorResponse.conflict('Email sudah digunakan');
    }
    targetUser.email = email.toLowerCase().trim();
  }
  if (phone !== undefined) targetUser.phone = phone.trim() || undefined;
  if (isActive !== undefined) {
    if (targetUser._id.toString() === user.userId) {
      return ErrorResponse.badRequest('Tidak bisa menonaktifkan akun sendiri');
    }
    // Deactivating a parent is deleting their account (ADM-3): Super Admin
    // only, via DELETE so the children go with it. Admin files a request.
    // Reactivating is Super Admin only too, so admin can't undo an approved deletion.
    if (targetUser.role === 'parent' && isActive !== targetUser.isActive && user.role !== 'super_admin') {
      return ErrorResponse.forbidden(
        isActive
          ? 'Mengaktifkan kembali akun orang tua hanya bisa dilakukan Super Admin'
          : 'Hapus akun orang tua harus lewat persetujuan Super Admin'
      );
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
  if (color !== undefined && targetUser.role === 'therapist') {
    if (!targetUser.profile) targetUser.profile = {};
    targetUser.profile.color = color ?? undefined;
    targetUser.markModified('profile');
  }
  // Therapist birth date — super_admin only (drives their birthday reminder).
  if (dateOfBirth !== undefined && targetUser.role === 'therapist') {
    if (user.role !== 'super_admin') {
      return ErrorResponse.forbidden('Hanya Super Admin yang dapat mengubah tanggal lahir terapis');
    }
    if (!targetUser.profile) targetUser.profile = {};
    targetUser.profile.dateOfBirth = dateOfBirth ? new Date(dateOfBirth + 'T00:00:00Z') : undefined;
    targetUser.markModified('profile');
  }
  if (address !== undefined && targetUser.role === 'parent') {
    if (!targetUser.profile) targetUser.profile = {};
    targetUser.profile.address = address.trim();
    targetUser.markModified('profile');
  }

  await targetUser.save();

  return SuccessResponse.ok({ user: targetUser.toSafeObject() }, 'Berhasil diperbarui');
});

export const DELETE = withAdminAuth(async (request: NextRequest, user: any) => {
  await connectToDatabase();

  const url = new URL(request.url);
  const id = url.pathname.split('/').slice(-1)[0];

  const targetUser = await User.findById(id);
  if (!targetUser || targetUser.role === 'super_admin') {
    return ErrorResponse.notFound('User');
  }

  if (targetUser._id.toString() === user.userId) {
    return ErrorResponse.badRequest('Tidak bisa menghapus akun sendiri');
  }

  if (targetUser.role === 'admin' && user.role !== 'super_admin') {
    return ErrorResponse.forbidden('Hanya Super Admin yang dapat menonaktifkan akun admin');
  }

  // Parent account deletion (ADM-3): Super Admin only, takes the children
  // along. Admin has to go through /api/deletion-requests instead.
  if (targetUser.role === 'parent') {
    if (user.role !== 'super_admin') {
      return ErrorResponse.forbidden('Hapus akun orang tua harus lewat persetujuan Super Admin');
    }
    const { childrenDeleted } = await deleteParentAccount(id);
    return SuccessResponse.ok({ childrenDeleted }, 'Akun orang tua dihapus');
  }

  targetUser.isActive = false;
  await targetUser.save();

  return SuccessResponse.ok({}, 'Terapis dinonaktifkan');
});
