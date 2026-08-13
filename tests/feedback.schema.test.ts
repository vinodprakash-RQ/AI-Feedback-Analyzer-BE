import { describe, expect, it } from 'vitest';
import { feedbackCreateSchema, feedbackListSchema } from '../src/schemas/feedback';

describe('feedback schemas', () => {
  it('applies defaults for a minimal feedback report', () => {
    expect(feedbackCreateSchema.parse({ title: 'Login fails', description: 'Cannot sign in' })).toMatchObject({
      priority: 'MEDIUM',
      category: 'BUG',
      source: 'IN_APP',
      tags: [],
    });
  });

  it('rejects invalid reporter email', () => {
    expect(() => feedbackCreateSchema.parse({ title: 'Issue', description: 'Details', reporterEmail: 'not-an-email' })).toThrow();
  });

  it('coerces pagination query values', () => {
    expect(feedbackListSchema.parse({ page: '2', pageSize: '10' })).toMatchObject({ page: 2, pageSize: 10 });
  });
});
