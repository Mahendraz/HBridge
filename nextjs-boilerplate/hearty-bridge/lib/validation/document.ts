import { z } from 'zod';

// Allowed MIME types for documents
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png'
];

// Maximum file size for documents (50MB)
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;

// Schema for uploading documents
export const uploadDocumentSchema = z.object({
  title: z.string()
    .min(1, 'Document title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  type: z.enum(['medical', 'educational', 'legal', 'other']),
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name cannot exceed 255 characters'),
  fileSize: z.number()
    .positive('File size must be positive')
    .max(MAX_DOCUMENT_SIZE, 'Document size cannot exceed 50MB'),
  mimeType: z.string()
    .refine((mimeType) => {
      return DOCUMENT_MIME_TYPES.includes(mimeType);
    }, 'Unsupported document type'),
  childId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
    .optional(),
  expiryDate: z.string()
    .datetime()
    .refine((date) => {
      return new Date(date) > new Date();
    }, 'Expiry date must be in the future')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters'))
    .optional()
    .default([]),
  description: z.string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  isConfidential: z.boolean().default(false),
  accessLevel: z.enum(['parent-only', 'therapist-only', 'shared']).default('shared'),
  parentDocumentId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent document ID format')
    .optional(),
  metadata: z.object({
    checksum: z.string().optional(),
    encryptionStatus: z.enum(['encrypted', 'plain']).default('plain'),
    ocrText: z.string().optional()
  }).optional()
});

// Schema for updating documents
export const updateDocumentSchema = z.object({
  title: z.string()
    .min(1, 'Document title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  type: z.enum(['medical', 'educational', 'legal', 'other']).optional(),
  expiryDate: z.string()
    .datetime()
    .refine((date) => {
      return new Date(date) > new Date();
    }, 'Expiry date must be in the future')
    .optional()
    .nullable(),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters'))
    .optional(),
  description: z.string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  isConfidential: z.boolean().optional(),
  accessLevel: z.enum(['parent-only', 'therapist-only', 'shared']).optional(),
  metadata: z.object({
    checksum: z.string().optional(),
    encryptionStatus: z.enum(['encrypted', 'plain']).optional(),
    ocrText: z.string().optional()
  }).optional()
});

// Schema for document queries
export const documentQuerySchema = z.object({
  childId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
    .optional(),
  type: z.enum(['medical', 'educational', 'legal', 'other']).optional(),
  accessLevel: z.enum(['parent-only', 'therapist-only', 'shared']).optional(),
  isConfidential: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  expiringWithinDays: z.number().int().min(1).max(365).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['uploadedAt', 'title', 'type', 'expiryDate']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Schema for document search
export const documentSearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query cannot exceed 200 characters'),
  childId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
    .optional(),
  type: z.enum(['medical', 'educational', 'legal', 'other']).optional(),
  accessLevel: z.enum(['parent-only', 'therapist-only', 'shared']).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0)
});

// Schema for bulk document operations
export const bulkDocumentOperationSchema = z.object({
  documentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid document ID format'))
    .min(1, 'At least one document ID is required')
    .max(50, 'Cannot operate on more than 50 documents at once'),
  operation: z.enum(['delete', 'updateTags', 'updateAccessLevel', 'updateConfidentiality']),
  data: z.object({
    tags: z.array(z.string().max(50)).optional(),
    accessLevel: z.enum(['parent-only', 'therapist-only', 'shared']).optional(),
    isConfidential: z.boolean().optional()
  }).optional()
});

// Schema for document version management
export const createDocumentVersionSchema = z.object({
  parentDocumentId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent document ID format'),
  title: z.string()
    .min(1, 'Document title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name cannot exceed 255 characters'),
  fileSize: z.number()
    .positive('File size must be positive')
    .max(MAX_DOCUMENT_SIZE, 'Document size cannot exceed 50MB'),
  mimeType: z.string()
    .refine((mimeType) => {
      return DOCUMENT_MIME_TYPES.includes(mimeType);
    }, 'Unsupported document type'),
  description: z.string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional()
});

// Schema for document sharing
export const shareDocumentSchema = z.object({
  userIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'))
    .min(1, 'At least one user ID is required')
    .max(20, 'Cannot share with more than 20 users at once'),
  accessLevel: z.enum(['view', 'download']).default('view'),
  expiryDate: z.string()
    .datetime()
    .refine((date) => {
      return new Date(date) > new Date();
    }, 'Expiry date must be in the future')
    .optional(),
  message: z.string()
    .max(500, 'Message cannot exceed 500 characters')
    .trim()
    .optional()
});

// Type definitions for validation
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;
export type DocumentSearchInput = z.infer<typeof documentSearchSchema>;
export type BulkDocumentOperationInput = z.infer<typeof bulkDocumentOperationSchema>;
export type CreateDocumentVersionInput = z.infer<typeof createDocumentVersionSchema>;
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>;

// Constants for use in API routes
export const DOCUMENT_CONSTANTS = {
  MAX_DOCUMENT_SIZE,
  DOCUMENT_MIME_TYPES
} as const;