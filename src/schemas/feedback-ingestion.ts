import { z } from 'zod';

const optionalText = z.string().trim().max(500).optional();

export const feedbackIngestionSchema = z.object({
  message: z.string().min(1, 'message is required').max(20_000, 'message cannot exceed 20,000 characters').refine((value) => value.trim().length > 0, 'message cannot be empty'),
  user_id: optionalText,
  conversation_id: optionalText,
  project_id: optionalText,
  source: z.string().trim().max(120).optional(),
  page_url: z.string().trim().max(2_048).refine((value) => {
    if (value.startsWith('/')) return true;
    if (!URL.canParse(value)) return false;
    return ['http:', 'https:'].includes(new URL(value).protocol);
  }, 'page_url must be an HTTP(S) URL or path').optional(),
  user_agent: z.string().max(1_000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).superRefine((value, context) => {
  if (value.metadata && Buffer.byteLength(JSON.stringify(value.metadata), 'utf8') > 10_000) {
    context.addIssue({ code: 'custom', path: ['metadata'], message: 'metadata cannot exceed 10,000 bytes' });
  }
});

export type FeedbackIngestionInput = z.infer<typeof feedbackIngestionSchema>;
