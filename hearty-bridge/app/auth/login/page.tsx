"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { ErrorAlert } from "@/components/ui/error";
import { LoginFormData, loginSchema } from "@/lib/types/auth";
import { useAuth } from "@/lib/contexts/auth-context";
import { AuthGuard } from "@/components/auth/auth-guard";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const t = useTranslations("auth.login");
  const tCommon = useTranslations("common");

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    clearErrors();

    try {
      await login(data);
    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message;

        if (errorMessage.includes(':')) {
          const hasFieldErrors = errorMessage.split(';').some(error => {
            const trimmedError = error.trim();
            if (trimmedError.includes(':')) {
              const [fieldPath, message] = trimmedError.split(':', 2);
              const field = fieldPath.trim();
              const errorMsg = message.trim();

              const fieldMapping: Record<string, keyof LoginFormData> = {
                'email': 'email',
                'password': 'password',
              };

              const mappedField = fieldMapping[field];
              if (mappedField) {
                setFieldError(mappedField, { type: 'server', message: errorMsg });
                return true;
              }
            }
            return false;
          });

          if (hasFieldErrors) {
            return;
          }
        }

        setError(errorMessage);
      } else {
        setError(t("loginFailed"));
      }
    }
  };

  return (
    <AuthGuard requireAuth={false}>
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
              <Image
                src="/images/logo-heartybridge.png"
                alt="Hearty Bridge"
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
              />
              <span className="text-2xl font-bold text-white">
                Hearty<span className="text-teal-400">Bridge</span>
              </span>
            </div>
            <AnimatedGradientText className="text-sm font-medium">
              {t("brandSubtitle")}
            </AnimatedGradientText>
          </div>

          {/* Login card */}
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
            <BorderBeam size={200} duration={8} colorFrom="#14b8a6" colorTo="#22c55e" />

            <div className="p-8 space-y-6">
              {/* Card header */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white">{t("title")}</h2>
                <p className="text-sm text-gray-400">{t("subtitle")}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <ErrorAlert
                    message={error}
                    onDismiss={() => setError(null)}
                  />
                )}

                {/* Email field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">{t("email")}</label>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    error={errors.email?.message}
                    autoComplete="email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">{t("password")}</label>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      error={errors.password?.message}
                      autoComplete="current-password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 focus:border-teal-400 focus:ring-teal-400/20"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-200 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me and forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      {...register("rememberMe")}
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-teal-500 focus:ring-teal-500"
                    />
                    <label className="text-sm text-gray-400">{t("rememberMe")}</label>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>

                {/* Submit button */}
                <ShimmerButton
                  type="submit"
                  background="rgba(196, 30, 52, 1)"
                  borderRadius="10px"
                  className="w-full justify-center text-sm font-semibold py-2.5 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? t("signingIn") : t("signIn")}
                </ShimmerButton>
              </form>

            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600">
            <p>
              {t("termsPrefix")}{" "}
              <Link href="/terms" className="text-teal-400 hover:text-teal-300 transition-colors">
                {tCommon("termsOfService")}
              </Link>{" "}
              {t("and")}{" "}
              <Link href="/privacy" className="text-teal-400 hover:text-teal-300 transition-colors">
                {tCommon("privacyPolicy")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
