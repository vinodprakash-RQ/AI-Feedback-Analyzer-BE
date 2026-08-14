import { z } from 'zod';

export const issueCategory = z.enum([
  'APPLICATION_GENERATION',
  'AI_RESPONSE',
  'BUILD_FAILURE',
  'UI_UX',
  'AUTHENTICATION',
  'PERFORMANCE',
  'INTEGRATION',
  'PRODUCT_UI',
  'FEATURE_REQUEST',
  'PAYMENTS',
  'CUSTOMER_SUPPORT',
  'BUG_MOBILE',
  'USABILITY',
  'NOTIFICATIONS',
  'ONBOARDING',
  'SECURITY',
  'AVAILABILITY',
  'GENERAL',
  'OTHER',
]);
export const issueSubcategory = z.string().trim().min(1).max(100);
export const issueSentiment = z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'FRUSTRATED', 'MIXED']);
export const issueSeverity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const issueStatus = z.enum(['NEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED']);
export const issueSort = z.enum(['newest', 'oldest', 'severity']);
export const issueUpdateSchema = z.object({ status: issueStatus });

export const issueListSchema = z.object({
  category: issueCategory.optional(),
  subcategory: issueSubcategory.optional(),
  sentiment: issueSentiment.optional(),
  severity: issueSeverity.optional(),
  status: issueStatus.optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
  search: z.string().trim().max(200).optional(),
  project_id: z.string().trim().max(500).optional(),
  sort: issueSort.default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).superRefine((value, context) => {
  if (value.from && value.to && value.from > value.to) {
    context.addIssue({ code: 'custom', path: ['from'], message: 'from must be before or equal to to' });
  }
});

export type IssueListInput = z.infer<typeof issueListSchema>;
export type IssueCategory = z.infer<typeof issueCategory>;
export type IssueSentiment = z.infer<typeof issueSentiment>;
export type IssueSeverity = z.infer<typeof issueSeverity>;
export type IssueStatus = z.infer<typeof issueStatus>;
