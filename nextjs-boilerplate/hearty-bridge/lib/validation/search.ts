import { z } from 'zod';

// Schema for general search across all entities
export const globalSearchSchema = z.object({
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query cannot exceed 200 characters')
    .trim(),
  entityTypes: z.array(z.enum(['child', 'user', 'document', 'message', 'milestone']))
    .optional(),
  limit: z.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0),
  filters: z.object({
    childId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
      .optional(),
    userId: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
      .optional(),
    dateRange: z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime()
    }).optional(),
    tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters'))
      .optional()
  }).optional()
});

// Schema for entity-specific search
export const entitySearchSchema = z.object({
  entityType: z.enum(['child', 'user', 'document', 'message', 'milestone']),
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query cannot exceed 200 characters')
    .trim(),
  limit: z.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0),
  sortBy: z.enum(['relevance', 'date', 'name']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Schema for indexing content
export const indexContentSchema = z.object({
  entityType: z.enum(['child', 'user', 'document', 'message', 'milestone']),
  entityId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid entity ID format'),
  content: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content cannot exceed 50000 characters'),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters'))
    .optional()
    .default([]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  permissions: z.object({
    viewableBy: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'))
      .optional()
      .default([]),
    roles: z.array(z.enum(['parent', 'therapist', 'family']))
      .optional()
      .default([])
  }).optional()
});

// Schema for updating search index
export const updateIndexSchema = z.object({
  entityId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid entity ID format'),
  content: z.string()
    .min(1, 'Content is required')
    .max(50000, 'Content cannot exceed 50000 characters'),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters'))
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  permissions: z.object({
    viewableBy: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'))
      .optional(),
    roles: z.array(z.enum(['parent', 'therapist', 'family']))
      .optional()
  }).optional()
});

// Schema for search suggestions/autocomplete
export const searchSuggestionSchema = z.object({
  query: z.string()
    .min(1, 'Query is required')
    .max(100, 'Query cannot exceed 100 characters')
    .trim(),
  entityType: z.enum(['child', 'user', 'document', 'message', 'milestone'])
    .optional(),
  limit: z.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(20, 'Limit cannot exceed 20')
    .default(10)
});

// Schema for search analytics
export const searchAnalyticsSchema = z.object({
  startDate: z.string()
    .datetime()
    .optional(),
  endDate: z.string()
    .datetime()
    .optional(),
  userId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
    .optional(),
  entityType: z.enum(['child', 'user', 'document', 'message', 'milestone'])
    .optional(),
  limit: z.number()
    .int()
    .min(1)
    .max(1000)
    .default(100)
});

// Schema for advanced search with multiple criteria
export const advancedSearchSchema = z.object({
  criteria: z.array(z.object({
    field: z.enum(['content', 'title', 'description', 'tags', 'name']),
    operator: z.enum(['contains', 'equals', 'startsWith', 'endsWith']),
    value: z.string()
      .min(1, 'Search value is required')
      .max(200, 'Search value cannot exceed 200 characters')
  })).min(1, 'At least one search criteria is required'),
  entityTypes: z.array(z.enum(['child', 'user', 'document', 'message', 'milestone']))
    .optional(),
  logicalOperator: z.enum(['AND', 'OR']).default('AND'),
  limit: z.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z.number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0),
  sortBy: z.enum(['relevance', 'date', 'name']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Schema for search history
export const searchHistorySchema = z.object({
  query: z.string()
    .min(1, 'Query is required')
    .max(200, 'Query cannot exceed 200 characters'),
  entityTypes: z.array(z.enum(['child', 'user', 'document', 'message', 'milestone']))
    .optional(),
  resultsCount: z.number()
    .int()
    .min(0, 'Results count cannot be negative'),
  executionTime: z.number()
    .min(0, 'Execution time cannot be negative'),
  clickedResults: z.array(z.object({
    entityType: z.enum(['child', 'user', 'document', 'message', 'milestone']),
    entityId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid entity ID format'),
    position: z.number().int().min(1)
  })).optional().default([])
});

// Schema for bulk index operations
export const bulkIndexOperationSchema = z.object({
  operation: z.enum(['index', 'update', 'delete']),
  entities: z.array(z.object({
    entityType: z.enum(['child', 'user', 'document', 'message', 'milestone']),
    entityId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid entity ID format'),
    content: z.string().optional(),
    tags: z.array(z.string().max(50)).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  })).min(1, 'At least one entity is required').max(100, 'Cannot process more than 100 entities at once')
});

// Type definitions for validation
export type GlobalSearchInput = z.infer<typeof globalSearchSchema>;
export type EntitySearchInput = z.infer<typeof entitySearchSchema>;
export type IndexContentInput = z.infer<typeof indexContentSchema>;
export type UpdateIndexInput = z.infer<typeof updateIndexSchema>;
export type SearchSuggestionInput = z.infer<typeof searchSuggestionSchema>;
export type SearchAnalyticsInput = z.infer<typeof searchAnalyticsSchema>;
export type AdvancedSearchInput = z.infer<typeof advancedSearchSchema>;
export type SearchHistoryInput = z.infer<typeof searchHistorySchema>;
export type BulkIndexOperationInput = z.infer<typeof bulkIndexOperationSchema>;