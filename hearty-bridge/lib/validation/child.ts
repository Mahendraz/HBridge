import { z } from 'zod';

// Common validation rules for children
export const childValidations = {
  name: z.string()
    .min(2, "Child name must be at least 2 characters")
    .max(100, "Child name cannot exceed 100 characters")
    .trim()
    .refine(
      (name) => /^[a-zA-Z\s'-]+$/.test(name),
      {
        message: "Name can only contain letters, spaces, hyphens, and apostrophes"
      }
    ),

  dateOfBirth: z.string()
    .min(1, "Date of birth is required")
    .refine(
      (date) => {
        const birthDate = new Date(date);
        const today = new Date();
        const minDate = new Date('1900-01-01');
        return birthDate <= today && birthDate >= minDate && !isNaN(birthDate.getTime());
      },
      {
        message: "Please provide a valid date of birth (not in the future)"
      }
    ),

  gender: z.enum(['male', 'female'], {
    message: "Gender must be either male or female",
  }),

  parentId: z.string()
    .min(1, "Parent ID is required")
    .refine(
      (id) => /^[0-9a-fA-F]{24}$/.test(id),
      {
        message: "Invalid parent ID format"
      }
    ),

  therapistId: z.string()
    .optional()
    .refine(
      (id) => !id || /^[0-9a-fA-F]{24}$/.test(id),
      {
        message: "Invalid therapist ID format"
      }
    ),

  medicalCondition: z.string()
    .max(200, "Medical condition description cannot exceed 200 characters")
    .trim(),

  medication: z.string()
    .max(200, "Medication description cannot exceed 200 characters")
    .trim(),

  allergy: z.string()
    .max(200, "Allergy description cannot exceed 200 characters")
    .trim(),

  medicalNotes: z.string()
    .max(2000, "Medical notes cannot exceed 2000 characters")
    .trim()
    .optional(),

  emergencyContactName: z.string()
    .max(100, "Emergency contact name cannot exceed 100 characters")
    .trim()
    .optional(),

  emergencyContactPhone: z.string()
    .optional()
    .refine(
      (phone) => !phone || /^\+?[\d\s\-\(\)]+$/.test(phone.trim()),
      {
        message: "Please enter a valid phone number"
      }
    )
    .refine(
      (phone) => !phone || phone.replace(/\D/g, '').length >= 10,
      {
        message: "Phone number must be at least 10 digits"
      }
    ),

  emergencyContactRelationship: z.string()
    .max(50, "Relationship cannot exceed 50 characters")
    .trim()
    .optional(),
};

// Create child schema
export const createChildSchema = z.object({
  name: childValidations.name,
  dateOfBirth: childValidations.dateOfBirth,
  gender: childValidations.gender,
  
  medicalInfo: z.object({
    conditions: z.array(childValidations.medicalCondition).optional().default([]),
    medications: z.array(childValidations.medication).optional().default([]),
    allergies: z.array(childValidations.allergy).optional().default([]),
    notes: childValidations.medicalNotes,
  }).optional(),
  
  contactInfo: z.object({
    emergencyContact: z.object({
      name: childValidations.emergencyContactName,
      phone: childValidations.emergencyContactPhone,
      relationship: childValidations.emergencyContactRelationship,
    }).optional(),
  }).optional(),
})
.refine((data) => {
  // If emergency contact is provided, all fields should be provided
  if (data.contactInfo?.emergencyContact) {
    const contact = data.contactInfo.emergencyContact;
    if ((contact.name && !contact.phone) || (contact.phone && !contact.name) || 
        (contact.name && contact.phone && !contact.relationship)) {
      return false;
    }
  }
  return true;
}, {
  message: "If providing emergency contact, name, phone, and relationship are all required",
  path: ["contactInfo", "emergencyContact"],
});

// Update child schema (all fields optional except ID validation)
export const updateChildSchema = z.object({
  name: childValidations.name.optional(),
  dateOfBirth: childValidations.dateOfBirth.optional(),
  gender: childValidations.gender.optional(),
  
  medicalInfo: z.object({
    conditions: z.array(childValidations.medicalCondition).optional(),
    medications: z.array(childValidations.medication).optional(),
    allergies: z.array(childValidations.allergy).optional(),
    notes: childValidations.medicalNotes,
  }).optional(),
  
  contactInfo: z.object({
    emergencyContact: z.object({
      name: childValidations.emergencyContactName,
      phone: childValidations.emergencyContactPhone,
      relationship: childValidations.emergencyContactRelationship,
    }).optional(),
  }).optional(),
})
.refine((data) => {
  // At least one field must be provided for update
  return Object.values(data).some(value => value !== undefined);
}, {
  message: "At least one field must be provided for update",
})
.refine((data) => {
  // Validate emergency contact consistency
  if (data.contactInfo?.emergencyContact) {
    const contact = data.contactInfo.emergencyContact;
    if ((contact.name && !contact.phone) || (contact.phone && !contact.name) || 
        (contact.name && contact.phone && !contact.relationship)) {
      return false;
    }
  }
  return true;
}, {
  message: "If updating emergency contact, name, phone, and relationship are all required",
  path: ["contactInfo", "emergencyContact"],
});

// Assign therapist schema
export const assignTherapistSchema = z.object({
  therapistId: z.string()
    .min(1, "Therapist ID is required")
    .refine(
      (id) => /^[0-9a-fA-F]{24}$/.test(id),
      {
        message: "Invalid therapist ID format"
      }
    ),
});

// Query parameters for listing children
export const childQuerySchema = z.object({
  page: z.string()
    .optional()
    .refine(
      (page) => !page || (/^\d+$/.test(page) && parseInt(page) > 0),
      {
        message: "Page must be a positive number"
      }
    )
    .transform(page => page ? parseInt(page) : 1),

  limit: z.string()
    .optional()
    .refine(
      (limit) => !limit || (/^\d+$/.test(limit) && parseInt(limit) > 0 && parseInt(limit) <= 100),
      {
        message: "Limit must be a positive number and cannot exceed 100"
      }
    )
    .transform(limit => limit ? parseInt(limit) : 10),

  search: z.string()
    .max(100, "Search query cannot exceed 100 characters")
    .trim()
    .optional(),

  therapistId: z.string()
    .optional()
    .refine(
      (id) => !id || /^[0-9a-fA-F]{24}$/.test(id),
      {
        message: "Invalid therapist ID format"
      }
    ),

  hasTherapist: z.enum(['true', 'false'])
    .optional()
    .transform(val => val === 'true'),

  sortBy: z.enum(['name', 'dateOfBirth', 'createdAt'])
    .optional()
    .default('createdAt'),

  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

// ID parameter validation
export const childIdSchema = z.object({
  id: z.string()
    .min(1, "Child ID is required")
    .refine(
      (id) => /^[0-9a-fA-F]{24}$/.test(id),
      {
        message: "Invalid child ID format"
      }
    ),
});

// Type exports for TypeScript
export type CreateChildData = z.infer<typeof createChildSchema>;
export type UpdateChildData = z.infer<typeof updateChildSchema>;
export type AssignTherapistData = z.infer<typeof assignTherapistSchema>;
export type ChildQueryParams = z.infer<typeof childQuerySchema>;
export type ChildIdParams = z.infer<typeof childIdSchema>;

// Validation helper function specifically for child operations
export function validateChildData<T>(
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
      errors: [{ field: 'unknown', message: 'Child data validation failed' }]
    };
  }
}

// Child-specific sanitizers
export const childSanitizers = {
  name: (name: string): string => name.trim().replace(/\s+/g, ' '),
  
  medicalArray: (arr: string[]): string[] => 
    arr.filter(item => item.trim().length > 0).map(item => item.trim()),
  
  notes: (notes: string): string => 
    notes.trim().replace(/\s+/g, ' ').substring(0, 2000),
  
  phone: (phone: string): string => phone.replace(/\s/g, ''),
  
  // Remove potentially harmful characters while preserving medical information
  sanitizeMedicalText: (text: string): string => {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
};

// Rate limiting schemas for child endpoints
export const childRateLimitSchemas = {
  create: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 children per hour per user
  },
  update: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 30, // 30 updates per 15 minutes per user
  },
  list: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 100, // 100 requests per 5 minutes per user
  },
  assignTherapist: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 assignments per 15 minutes per user
  }
};