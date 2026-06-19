"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { EyeIcon, EyeOffIcon, HeartIcon, LockIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ErrorAlert } from "@/components/ui/error";
import { useAuth } from "@/lib/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { DotPattern } from "@/components/magicui/dot-pattern";

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Password harus minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
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
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Re-fetch user from server to get updated mustChangePassword: false
        await refreshUser();
        router.replace("/dashboard");
      } else {
        setError(result.error || result.message || "Gagal mengubah password");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="relative min-h-screen flex items-center justify-center bg-gray-950 p-4 overflow-hidden">
        {/* Dot pattern background */}
        <DotPattern className="text-teal-400/20" />

        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md space-y-6">
          {/* Brand header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">
                Hearty<span className="text-teal-400">Bridge</span>
              </span>
            </div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-teal-500/10 border border-teal-500/20 px-4 py-1.5">
              <LockIcon className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-sm text-teal-300 font-medium">Keamanan Akun</span>
            </div>
          </div>

          {/* Card */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
            <BorderBeam size={200} duration={8} colorFrom="#14b8a6" colorTo="#22c55e" />

            <div className="p-8 space-y-6">
              {/* Card header */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white">Buat Password Baru</h2>
                <p className="text-sm text-gray-400">
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

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Password Baru</label>
                  <div className="relative">
                    <Input
                      {...register("newPassword")}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      error={errors.newPassword?.message}
                      autoComplete="new-password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition-colors"
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
                  <label className="text-sm font-medium text-gray-300">Konfirmasi Password</label>
                  <div className="relative">
                    <Input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      error={errors.confirmPassword?.message}
                      autoComplete="new-password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition-colors"
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
                  background="rgba(20, 184, 166, 1)"
                  borderRadius="10px"
                  className="w-full justify-center text-sm font-semibold py-2.5 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
                </ShimmerButton>
              </form>

              <p className="text-center text-xs text-gray-500">
                Password baru Anda harus berbeda dari password sebelumnya dan minimal 8 karakter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
