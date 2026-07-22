import { z } from "zod";

// User role types
export type UserRole = "admin" | "therapist" | "parent" | "super_admin";

// Registration form schema
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["admin", "therapist", "parent", "super_admin"], {
    message: "Please select a role",
  }),
  phone: z.string().optional(),
  // Therapist-specific fields
  specialization: z.string().optional(),
  clinic: z.string().optional(),
  experience: z.number().optional(),
  // Terms acceptance
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If therapist, specialization is required
  if (data.role === "therapist") {
    return data.specialization && data.specialization.length > 0;
  }
  return true;
}, {
  message: "Specialization is required for therapists",
  path: ["specialization"],
});

// Login form schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Form types inferred from schemas
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;

// User profile interface (matches the backend User model)
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  profile?: {
    specialization?: string; // for therapists
    clinic?: string; // for therapists
    experience?: number; // for therapists
  };
  mustChangePassword?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
  details?: any[];
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginFormData) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Role-specific navigation items
export interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}