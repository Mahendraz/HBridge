"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { LoadingSpinner } from "@/components/ui/loading";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  /**
   * Public pages only (`requireAuth` false): render the children while the
   * auth check is still running instead of a spinner, so the page is part of
   * the server HTML. Signed-in users are still redirected once it resolves.
   */
  renderWhileLoading?: boolean;
}

/**
 * AuthGuard component for redirecting authenticated users away from auth pages
 * and protecting public routes
 */
export function AuthGuard({ 
  children, 
  requireAuth = false,
  redirectTo,
  renderWhileLoading = false,
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user) {
        // Redirect to login if authentication is required but user is not logged in
        router.replace("/auth/login");
        return;
      }

      if (requireAuth && user && user.mustChangePassword) {
        // Force password change before accessing protected pages
        // Allow /auth/change-password itself to avoid loop
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth/change-password")) {
          router.replace("/auth/change-password");
          return;
        }
      }

      if (!requireAuth && user && redirectTo) {
        // Redirect authenticated users away from auth pages
        if (user.mustChangePassword) {
          router.replace("/auth/change-password");
        } else {
          router.replace(redirectTo);
        }
        return;
      }

      if (!requireAuth && user && !redirectTo) {
        // Default redirect for authenticated users
        if (user.mustChangePassword) {
          router.replace("/auth/change-password");
        } else {
          router.replace("/dashboard");
        }
        return;
      }
    }
  }, [user, isLoading, router, requireAuth, redirectTo]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    // Same fragment as the final branch, so the children don't remount
    // when isLoading flips.
    if (renderWhileLoading && !requireAuth) return <>{children}</>;
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render children during redirect
  if (requireAuth && !user) {
    return null;
  }

  if (!requireAuth && user && (redirectTo || !redirectTo)) {
    return null;
  }

  return <>{children}</>;
}