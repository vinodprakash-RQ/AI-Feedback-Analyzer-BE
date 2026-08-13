import { z } from 'zod';

export const feedbackStatus = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const feedbackSeverity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const feedbackCategory = z.enum([
  'APPLICATION_GENERATION',
  'AI_RESPONSE',
  'BUILD_FAILURE',
  'UI_UX',
  'AUTHENTICATION',
  'PERFORMANCE',
  'INTEGRATION',
  'OTHER',
]);
export const feedbackSentiment = z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FRUSTRATED']);
export const feedbackSource = z.enum(['IN_APP', 'EMAIL', 'SUPPORT_TICKET', 'API']);

export const feedbackCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10_000),
  severity: feedbackSeverity.default('MEDIUM'),
  category: feedbackCategory.default('OTHER'),
  sentiment: feedbackSentiment.default('NEUTRAL'),
  source: feedbackSource.default('IN_APP'),
  reporterEmail: z.string().email().optional(),
  assignee: z.string().trim().max(120).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const feedbackUpdateSchema = feedbackCreateSchema.partial().extend({
  status: feedbackStatus.optional(),
});

export const feedbackListSchema = z.object({
  status: feedbackStatus.optional(),
  severity: feedbackSeverity.optional(),
  category: feedbackCategory.optional(),
  sentiment: feedbackSentiment.optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;
export type FeedbackUpdateInput = z.infer<typeof feedbackUpdateSchema>;
export type FeedbackListInput = z.infer<typeof feedbackListSchema>;
