import { describe, expect, it } from 'vitest';
import { issueCategory, issueListSchema, issueSentiment } from '../src/schemas/issue';

describe('issue API contract', () => {
  it('supports persisted feedback dimensions', () => {
    expect(issueCategory.parse('PAYMENTS')).toBe('PAYMENTS');
    expect(issueSentiment.parse('MIXED')).toBe('MIXED');
  });

  it('validates issue list pagination and sorting', () => {
    expect(issueListSchema.parse({ page: '2', pageSize: '10', sort: 'severity' })).toMatchObject({
      page: 2,
      pageSize: 10,
      sort: 'severity',
    });
  });

  it('rejects an inverted date range', () => {
    expect(() => issueListSchema.parse({ from: '2026-08-12', to: '2026-08-01' })).toThrow();
  });
});
