import { z } from 'zod';

// Allowed MIME types for different media types
const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp'
];

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv'
];

const AUDIO_MIME_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/m4a'
];

// Maximum file sizes (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

// Schema for uploading media files
export const uploadMediaSchema = z.object({
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name cannot exceed 255 characters'),
  originalName: z.string()
    .min(1, 'Original file name is required')
    .max(255, 'Original file name cannot exceed 255 characters'),
  mimeType: z.string()
    .refine((mimeType) => {
      return [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...AUDIO_MIME_TYPES].includes(mimeType);
    }, 'Unsupported file type'),
  size: z.number()
    .positive('File size must be positive')
    .max(MAX_VIDEO_SIZE, 'File too large'),
  type: z.enum(['photo', 'video', 'audio']),
  childId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters'))
    .optional()
    .default([]),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  isPublic: z.boolean().default(false),
  metadata: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }).optional()
}).refine((data) => {
  // Validate file size based on type
  if (data.type === 'photo' && data.size > MAX_IMAGE_SIZE) {
    return false;
  }
  if (data.type === 'video' && data.size > MAX_VIDEO_SIZE) {
    return false;
  }
  if (data.type === 'audio' && data.size > MAX_AUDIO_SIZE) {
    return false;
  }
  return true;
}, {
  message: 'File size exceeds maximum allowed for this media type',
  path: ['size']
}).refine((data) => {
  // Validate MIME type matches media type
  if (data.type === 'photo' && !IMAGE_MIME_TYPES.includes(data.mimeType)) {
    return false;
  }
  if (data.type === 'video' && !VIDEO_MIME_TYPES.includes(data.mimeType)) {
    return false;
  }
  if (data.type === 'audio' && !AUDIO_MIME_TYPES.includes(data.mimeType)) {
    return false;
  }
  return true;
}, {
  message: 'MIME type does not match media type',
  path: ['mimeType']
});

// Schema for updating media files
export const updateMediaSchema = z.object({
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters'))
    .optional(),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim()
    .optional(),
  isPublic: z.boolean().optional(),
  metadata: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }).optional()
});

// Schema for media file queries
export const mediaQuerySchema = z.object({
  childId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
    .optional(),
  type: z.enum(['photo', 'video', 'audio']).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['uploadedAt', 'size', 'type']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Schema for bulk media operations
export const bulkMediaOperationSchema = z.object({
  mediaIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid media ID format'))
    .min(1, 'At least one media ID is required')
    .max(50, 'Cannot operate on more than 50 media files at once'),
  operation: z.enum(['delete', 'updateTags', 'updateVisibility']),
  data: z.object({
    tags: z.array(z.string().max(50)).optional(),
    isPublic: z.boolean().optional()
  }).optional()
});

// Schema for media search
export const mediaSearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query cannot exceed 200 characters'),
  childId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
    .optional(),
  type: z.enum(['photo', 'video', 'audio']).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0)
});

// Type definitions for validation
export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type MediaQueryInput = z.infer<typeof mediaQuerySchema>;
export type BulkMediaOperationInput = z.infer<typeof bulkMediaOperationSchema>;
export type MediaSearchInput = z.infer<typeof mediaSearchSchema>;

// Constants for use in API routes
export const MEDIA_CONSTANTS = {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_AUDIO_SIZE,
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  AUDIO_MIME_TYPES
} as const;