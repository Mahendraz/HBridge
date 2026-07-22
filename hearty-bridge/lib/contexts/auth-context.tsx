"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthContextType, User, LoginFormData, RegisterFormData, AuthResponse } from "@/lib/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem("token");
        }
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.success && data.user && data.token) {
        setUser(data.user);
        localStorage.setItem("token", data.token);
        setIsLoading(false);

        // Redirect to change-password if required, otherwise dashboard
        if (data.user.mustChangePassword) {
          router.push("/auth/change-password");
        } else {
          router.push("/dashboard");
        }
      } else {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          const fieldErrors = data.details.map((detail: any) =>
            `${detail.field}: ${detail.message}`
          ).join('; ');
          throw new Error(fieldErrors || data.message || data.error || "Login failed");
        }
        throw new Error(data.message || data.error || "Login failed");
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (userData: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          confirmPassword: userData.confirmPassword,
          role: userData.role,
          phone: userData.phone || undefined,
          acceptTerms: userData.acceptTerms,
          ...(userData.role === "therapist" && {
            specialization: userData.specialization,
            clinic: userData.clinic,
            experience: userData.experience,
          }),
        }),
      });

      const data: AuthResponse = await response.json();

      if (response.ok && data.success && data.user && data.token) {
        setUser(data.user);
        localStorage.setItem("token", data.token);
        setIsLoading(false);
        
        // Redirect to unified dashboard
        router.push("/dashboard");
      } else {
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          const fieldErrors = data.details.map((detail: any) => 
            `${detail.field}: ${detail.message}`
          ).join('; ');
          throw new Error(fieldErrors || data.message || data.error || "Registration failed");
        }
        throw new Error(data.message || data.error || "Registration failed");
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      router.push("/auth/login");
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result: AuthResponse = await response.json();

      if (response.ok && result.success && result.user) {
        setUser(result.user);
      } else {
        throw new Error(result.message || result.error || "Profile update failed");
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}