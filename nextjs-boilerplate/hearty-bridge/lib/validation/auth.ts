import { z } from 'zod';

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Common validation rules
export const commonValidations = {
  email: z.string()
    .email("Please enter a valid email address")
    .min(5, "Email must be at least 5 characters")
    .max(320, "Email cannot exceed 320 characters")
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .refine(
      (password) => passwordRegex.test(password),
      {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }
    ),

  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim()
    .refine(
      (name) => /^[a-zA-Z\s'-]+$/.test(name),
      {
        message: "Name can only contain letters, spaces, hyphens, and apostrophes"
      }
    ),

  phone: z.union([
    z.string().min(1).refine(
      (phone) => /^\+?[\d\s\-\(\)]+$/.test(phone.trim()),
      { message: "Please enter a valid phone number" }
    ).refine(
      (phone) => phone.replace(/\D/g, '').length >= 10,
      { message: "Phone number must be at least 10 digits" }
    ),
    z.string().length(0),
    z.undefined()
  ]).optional(),

  role: z.enum(["therapist", "parent"], {
    message: "Role must be either therapist or parent",
  })
};

// Registration schema
export const registerSchema = z.object({
  name: commonValidations.name,
  email: commonValidations.email,
  password: commonValidations.password,
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: commonValidations.role,
  phone: commonValidations.phone,
  
  // Therapist-specific fields
  specialization: z.string()
    .max(200, "Specialization cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
  
  clinic: z.string()
    .max(200, "Clinic name cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
    
  experience: z.union([
    z.number().min(0, "Experience cannot be negative").max(50, "Experience cannot exceed 50 years"),
    z.string().transform((val) => val === "" ? undefined : Number(val))
  ]).optional(),
    
  // Terms acceptance
  acceptTerms: z.union([
    z.boolean(),
    z.string().transform((val) => val === "true" || val === "on"),
    z.literal("on").transform(() => true)
  ]).refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
.refine((data) => {
  // If therapist, specialization is required
  if (data.role === "therapist") {
    return data.specialization && data.specialization.trim().length > 0;
  }
  return true;
}, {
  message: "Specialization is required for therapists",
  path: ["specialization"],
});

// Login schema
export const loginSchema = z.object({
  email: commonValidations.email,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: commonValidations.name.optional(),
  phone: commonValidations.phone,
  avatar: z.string()
    .url("Please provide a valid URL for avatar")
    .optional(),
  
  profile: z.object({
    specialization: z.string()
      .max(200, "Specialization cannot exceed 200 characters")
      .optional(),
    
    clinic: z.string()
      .max(200, "Clinic name cannot exceed 200 characters")
      .optional(),
      
    experience: z.number()
      .min(0, "Experience cannot be negative")
      .max(50, "Experience cannot exceed 50 years")
      .optional(),
  }).optional()
})
.refine((data) => {
  // At least one field must be provided for update
  return Object.values(data).some(value => value !== undefined);
}, {
  message: "At least one field must be provided for update",
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: commonValidations.password,
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
})
.refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
})
.refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// Email verification schema
export const emailVerificationSchema = z.object({
  email: commonValidations.email,
  code: z.string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: commonValidations.email,
});

// Password reset schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: commonValidations.password,
  confirmNewPassword: z.string().min(1, "Please confirm your new password"),
})
.refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

// Account deactivation schema
export const accountDeactivationSchema = z.object({
  password: z.string().min(1, "Password is required to deactivate account"),
  reason: z.string()
    .min(10, "Please provide a reason (at least 10 characters)")
    .max(500, "Reason cannot exceed 500 characters")
    .optional(),
  confirmDeactivation: z.boolean()
    .refine(val => val === true, {
      message: "You must confirm account deactivation",
    }),
});

// Type exports for TypeScript
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetData = z.infer<typeof passwordResetSchema>;
export type AccountDeactivationData = z.infer<typeof accountDeactivationSchema>;

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    };
  }
}

// Sanitization helpers
export const sanitizers = {
  email: (email: string): string => email.toLowerCase().trim(),
  name: (name: string): string => name.trim().replace(/\s+/g, ' '),
  phone: (phone: string): string => phone.replace(/\s/g, ''),
  
  // Remove potentially harmful characters
  sanitizeString: (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
};

// Rate limiting schemas for different endpoints
export const rateLimitSchemas = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour per IP
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 reset requests per hour
  },
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 verification attempts per hour
  }
};