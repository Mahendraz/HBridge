import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAdminAuth } from '@/lib/middleware/auth';
import { JWTPayload } from '@/lib/utils/jwt';
import {
  ErrorResponse,
  SuccessResponse,
  handleValidationError,
  ErrorCodes,
} from '@/lib/utils/error-handler';
import { generateTempPassword } from '@/lib/utils/generate-password';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  // Kalau kosong/tidak dikirim, sistem yang generate password sementara.
  newPassword: z.string().min(8, 'Password minimal 8 karakter').optional(),
  // Default true: user wajib ganti sendiri saat login berikutnya.
  mustChangePassword: z.boolean().optional(),
});

/**
 * Reset password user oleh admin / super admin.
 *
 * Aturan akses:
 * - super_admin  → boleh reset siapa saja kecuali dirinya sendiri.
 * - admin        → hanya boleh reset therapist & parent (bukan admin lain,
 *                  bukan super_admin, bukan dirinya sendiri).
 *
 * Password plaintext hanya dikembalikan sekali di response ini dan tidak pernah
 * disimpan — hashing dikerjakan pre-save hook di models/User.ts.
 */
export const POST = withAdminAuth(async (request: NextRequest, actor: JWTPayload) => {
  await connectToDatabase();

  const url = new URL(request.url);
  // .../api/admin/users/<id>/reset-password
  const id = url.pathname.split('/').slice(-2)[0];

  const body = await request.json().catch(() => ({}));
  const result = resetPasswordSchema.safeParse(body);
  if (!result.success) {
    return handleValidationError(result.error);
  }

  const targetUser = await User.findById(id);
  if (!targetUser) {
    return ErrorResponse.notFound('User tidak ditemukan', ErrorCodes.USER_NOT_FOUND);
  }

  if (targetUser._id.toString() === actor.userId) {
    return ErrorResponse.badRequest(
      'Tidak bisa reset password akun sendiri. Gunakan menu Ganti Password.',
      ErrorCodes.OPERATION_NOT_ALLOWED
    );
  }

  if (actor.role !== 'super_admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
    return ErrorResponse.forbidden(
      'Hanya super admin yang bisa reset password akun admin.',
      ErrorCodes.INSUFFICIENT_PERMISSIONS
    );
  }

  const { newPassword, mustChangePassword = true } = result.data;
  const password = newPassword?.trim() || generateTempPassword();

  targetUser.password = password;
  targetUser.mustChangePassword = mustChangePassword;
  await targetUser.save();

  console.log(
    `[reset-password] ${actor.role} ${actor.email} mereset password ${targetUser.role} ${targetUser.email}`
  );

  return SuccessResponse.ok(
    {
      user: {
        _id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      // Tampilkan ke admin sekali saja — setelah ini hanya hash yang tersimpan.
      tempPassword: password,
      generated: !newPassword?.trim(),
      mustChangePassword: targetUser.mustChangePassword,
    },
    'Password berhasil direset'
  );
});

export async function GET() {
  return ErrorResponse.methodNotAllowed(['POST']);
}
