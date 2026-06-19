import { z } from 'zod';

// Schema for creating a new conversation
export const createConversationSchema = z.object({
  participantIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid participant ID format'))
    .min(1, 'At least one participant is required')
    .max(10, 'Cannot have more than 10 participants'),
  type: z.enum(['direct', 'group', 'support']),
  title: z.string()
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  childId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
    .optional(),
  settings: z.object({
    allowFileSharing: z.boolean().default(true),
    allowVideoCall: z.boolean().default(true),
    messageRetention: z.number().int().min(1).default(365),
    notifications: z.boolean().default(true)
  }).optional()
}).refine((data) => {
  // Direct conversations must have exactly 2 participants
  if (data.type === 'direct' && data.participantIds.length !== 2) {
    return false;
  }
  return true;
}, {
  message: 'Direct conversations must have exactly 2 participants',
  path: ['participantIds']
}).refine((data) => {
  // Group conversations with more than 2 participants must have a title
  if (data.type === 'group' && data.participantIds.length > 2 && !data.title) {
    return false;
  }
  return true;
}, {
  message: 'Group conversations with more than 2 participants must have a title',
  path: ['title']
});

// Schema for updating conversation settings
export const updateConversationSchema = z.object({
  title: z.string()
    .max(200, 'Title cannot exceed 200 characters')
    .trim()
    .optional(),
  settings: z.object({
    allowFileSharing: z.boolean().optional(),
    allowVideoCall: z.boolean().optional(),
    messageRetention: z.number().int().min(1).optional(),
    notifications: z.boolean().optional()
  }).optional()
});

// Schema for adding participant to conversation
export const addParticipantSchema = z.object({
  userId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format'),
  role: z.enum(['parent', 'therapist', 'family'])
});

// Schema for sending a message
export const sendMessageSchema = z.object({
  conversationId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation ID format'),
  content: z.string()
    .max(5000, 'Message content cannot exceed 5000 characters')
    .trim()
    .optional(),
  messageType: z.enum(['text', 'image', 'video', 'audio', 'document', 'system']),
  attachmentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid attachment ID format'))
    .optional()
    .default([]),
  replyToMessageId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID format')
    .optional(),
  metadata: z.object({
    fileSize: z.number().positive().optional(),
    duration: z.number().positive().optional(),
    systemEventType: z.string().optional()
  }).optional()
}).refine((data) => {
  // Text messages must have content
  if (data.messageType === 'text' && (!data.content || data.content.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Text messages must have content',
  path: ['content']
}).refine((data) => {
  // Media messages must have attachments
  if (['image', 'video', 'audio', 'document'].includes(data.messageType) && 
      (!data.attachmentIds || data.attachmentIds.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Media messages must have attachments',
  path: ['attachmentIds']
});

// Schema for updating a message
export const updateMessageSchema = z.object({
  content: z.string()
    .max(5000, 'Message content cannot exceed 5000 characters')
    .trim()
    .optional(),
  attachmentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid attachment ID format'))
    .optional()
});

// Schema for message reactions
export const addReactionSchema = z.object({
  emoji: z.string()
    .min(1, 'Emoji is required')
    .max(10, 'Emoji cannot exceed 10 characters')
    .trim()
});

// Schema for message queries
export const messageQuerySchema = z.object({
  conversationId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation ID format'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  messageType: z.enum(['text', 'image', 'video', 'audio', 'document', 'system']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Schema for conversation queries
export const conversationQuerySchema = z.object({
  type: z.enum(['direct', 'group', 'support']).optional(),
  childId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid child ID format')
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  includeArchived: z.boolean().default(false)
});

// Schema for message search
export const messageSearchSchema = z.object({
  conversationId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation ID format')
    .optional(),
  query: z.string()
    .min(1, 'Search query is required')
    .max(200, 'Search query cannot exceed 200 characters'),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0)
});

// Schema for marking messages as read
export const markAsReadSchema = z.object({
  conversationId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation ID format'),
  messageIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID format'))
    .optional() // If not provided, mark all unread messages as read
});

// Schema for bulk message operations
export const bulkMessageOperationSchema = z.object({
  messageIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid message ID format'))
    .min(1, 'At least one message ID is required')
    .max(100, 'Cannot operate on more than 100 messages at once'),
  operation: z.enum(['delete', 'markAsRead', 'markAsUnread'])
});

// Type definitions for validation
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type AddParticipantInput = z.infer<typeof addParticipantSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
export type ConversationQueryInput = z.infer<typeof conversationQuerySchema>;
export type MessageSearchInput = z.infer<typeof messageSearchSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type BulkMessageOperationInput = z.infer<typeof bulkMessageOperationSchema>;