import { z } from 'zod';

const optionalText = z.string().trim().max(500).optional();

export const feedbackIngestionSchema = z.object({
  message: z.string().trim().min(1, 'message is required').max(20_000, 'message cannot exceed 20,000 characters'),
  user_id: optionalText,
  conversation_id: optionalText,
  project_id: optionalText,
  source: z.string().trim().max(120).optional(),
  page_url: z.string().trim().max(2_048).refine((value) => value.startsWith('/') || URL.canParse(value), 'page_url must be a URL or path').optional(),
  user_agent: z.string().max(1_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).superRefine((value, context) => {
  if (value.metadata && JSON.stringify(value.metadata).length > 10_000) {
    context.addIssue({ code: 'custom', path: ['metadata'], message: 'metadata cannot exceed 10,000 bytes' });
  }
});

export type FeedbackIngestionInput = z.infer<typeof feedbackIngestionSchema>;
