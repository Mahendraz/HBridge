"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Image from "next/image";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ErrorAlert } from "@/components/ui/error";
import { useAuth } from "@/lib/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

// Mirrors the server rules in /api/auth/change-password (commonValidations.password).
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string()
    .min(8, "Password harus minimal 8 karakter")
    .max(128, "Password maksimal 128 karakter")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, "Password harus mengandung huruf kecil, huruf besar, angka, dan simbol (@$!%*?&)"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: "Password baru harus berbeda dari password saat ini",
  path: ["newPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Changing the password revokes every earlier token, this one included;
        // the server hands back a replacement for this session.
        if (result.token) localStorage.setItem("token", result.token);
        // Re-fetch user from server to get updated mustChangePassword: false
        await refreshUser();
        router.replace("/dashboard");
      } else {
        const detail = Array.isArray(result.details) ? result.details[0]?.message : undefined;
        setError(detail || result.error || result.message || "Gagal mengubah password");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="relative min-h-screen flex items-center justify-center bg-linear-to-b from-rose-50 via-white to-white p-4 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-[rgba(244,163,172,0.25)] blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-6">
          {/* Brand header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Image
                src="/images/logo-heartybridge.png"
                alt="Hearty Bridge"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
              <span className="text-2xl font-bold text-gray-900">
                Hearty<span className="text-teal-600">Bridge</span>
              </span>
            </div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-brand-coral-tint border border-brand-coral-light px-4 py-1.5">
              <LockIcon className="h-3.5 w-3.5 text-brand-coral" />
              <span className="text-sm text-brand-coral font-medium">Keamanan Akun</span>
            </div>
          </div>

          {/* Card */}
          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            <BorderBeam size={200} duration={8} colorFrom="#c41e34" colorTo="#f0475a" />

            <div className="p-8 space-y-6">
              {/* Card header */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-gray-900">Buat Password Baru</h2>
                <p className="text-sm text-gray-600">
                  {user?.name ? `Halo ${user.name}, ` : ""}
                  Untuk keamanan akun, silakan buat password baru sebelum melanjutkan.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <ErrorAlert
                    message={error}
                    onDismiss={() => setError(null)}
                  />
                )}

                {/* Current Password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Password Saat Ini</label>
                  <div className="relative">
                    <Input
                      {...register("currentPassword")}
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Password yang dipakai untuk login"
                      error={errors.currentPassword?.message}
                      autoComplete="current-password"
                      className="focus-visible:ring-brand-coral"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Password Baru</label>
                  <div className="relative">
                    <Input
                      {...register("newPassword")}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      error={errors.newPassword?.message}
                      autoComplete="new-password"
                      className="focus-visible:ring-brand-coral"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Konfirmasi Password</label>
                  <div className="relative">
                    <Input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      error={errors.confirmPassword?.message}
                      autoComplete="new-password"
                      className="focus-visible:ring-brand-coral"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <ShimmerButton
                  type="submit"
                  background="rgba(196, 30, 52, 1)"
                  borderRadius="10px"
                  className="w-full justify-center text-sm font-semibold py-2.5 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
                </ShimmerButton>
              </form>

              <p className="text-center text-xs text-gray-500">
                Password baru minimal 8 karakter, berbeda dari password sebelumnya, dan mengandung huruf kecil, huruf besar, angka, serta simbol (@$!%*?&).
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
