import { z } from 'zod';

// Schema for creating a new family
export const createFamilySchema = z.object({
  familyName: z.string()
    .min(2, 'Family name must be at least 2 characters')
    .max(100, 'Family name cannot exceed 100 characters')
    .trim(),
  primaryParents: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent ID format'))
    .min(1, 'At least one primary parent is required')
    .max(2, 'Cannot have more than 2 primary parents'),
  children: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format'))
    .optional()
    .default([]),
  settings: z.object({
    visibility: z.enum(['private', 'therapist-visible', 'public']).default('private'),
    allowMemberInvites: z.boolean().default(true),
    requireApproval: z.boolean().default(true),
    sharePhotos: z.boolean().default(false),
    shareDocuments: z.boolean().default(false)
  }).optional()
});

// Schema for updating family information
export const updateFamilySchema = z.object({
  familyName: z.string()
    .min(2, 'Family name must be at least 2 characters')
    .max(100, 'Family name cannot exceed 100 characters')
    .trim()
    .optional(),
  settings: z.object({
    visibility: z.enum(['private', 'therapist-visible', 'public']).optional(),
    allowMemberInvites: z.boolean().optional(),
    requireApproval: z.boolean().optional(),
    sharePhotos: z.boolean().optional(),
    shareDocuments: z.boolean().optional()
  }).optional()
});

// Schema for adding a family member
export const addFamilyMemberSchema = z.object({
  userId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
    .optional(),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  relationship: z.string()
    .min(1, 'Relationship is required')
    .max(50, 'Relationship cannot exceed 50 characters')
    .trim(),
  contactInfo: z.object({
    email: z.string()
      .email('Invalid email format')
      .optional(),
    phone: z.string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(20, 'Phone number cannot exceed 20 characters')
      .optional()
  }).optional(),
  role: z.enum(['caregiver', 'emergency-contact', 'family', 'support']),
  permissions: z.array(z.enum([
    'view-profile',
    'edit-profile',
    'view-media',
    'upload-media',
    'view-documents',
    'upload-documents',
    'view-messages',
    'send-messages',
    'manage-family'
  ])).optional()
});

// Schema for updating family member
export const updateFamilyMemberSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .optional(),
  relationship: z.string()
    .min(1, 'Relationship is required')
    .max(50, 'Relationship cannot exceed 50 characters')
    .trim()
    .optional(),
  contactInfo: z.object({
    email: z.string()
      .email('Invalid email format')
      .optional(),
    phone: z.string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(20, 'Phone number cannot exceed 20 characters')
      .optional()
  }).optional(),
  role: z.enum(['caregiver', 'emergency-contact', 'family', 'support']).optional(),
  permissions: z.array(z.enum([
    'view-profile',
    'edit-profile',
    'view-media',
    'upload-media',
    'view-documents',
    'upload-documents',
    'view-messages',
    'send-messages',
    'manage-family'
  ])).optional(),
  isActive: z.boolean().optional()
});

// Schema for family tree node
export const familyTreeNodeSchema = z.object({
  memberId: z.string()
    .min(1, 'Member ID is required'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  relationship: z.string()
    .min(1, 'Relationship is required')
    .max(50, 'Relationship cannot exceed 50 characters')
    .trim(),
  generation: z.number()
    .int('Generation must be an integer')
    .min(0, 'Generation cannot be negative'),
  parentIds: z.array(z.string()).default([]),
  avatar: z.string()
    .url('Avatar must be a valid URL')
    .optional(),
  isDeceased: z.boolean().default(false),
  birthYear: z.number()
    .int('Birth year must be an integer')
    .min(1800, 'Birth year must be after 1800')
    .max(new Date().getFullYear(), 'Birth year cannot be in the future')
    .optional(),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .trim()
    .optional()
});

// Schema for updating family tree
export const updateFamilyTreeSchema = z.object({
  familyTree: z.array(familyTreeNodeSchema)
    .min(0, 'Family tree cannot be empty')
});

// Type definitions for validation
export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;
export type AddFamilyMemberInput = z.infer<typeof addFamilyMemberSchema>;
export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberSchema>;
export type FamilyTreeNodeInput = z.infer<typeof familyTreeNodeSchema>;
export type UpdateFamilyTreeInput = z.infer<typeof updateFamilyTreeSchema>;