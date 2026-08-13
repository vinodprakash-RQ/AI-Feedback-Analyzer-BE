import { describe, expect, it } from 'vitest';
import { issueListSchema } from '../src/schemas/issue';
import { listIssues } from '../src/services/issue.service';

describe('issue list contract', () => {
  it('applies pagination and newest sorting defaults', () => {
    const input = issueListSchema.parse({ page: '1', pageSize: '2' });
    const result = listIssues(input);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].createdAt >= result.items[1].createdAt).toBe(true);
    expect(result.pagination.total).toBe(5);
  });

  it('filters by search and issue dimensions', () => {
    const input = issueListSchema.parse({ search: 'module', category: 'BUILD_FAILURE', severity: 'CRITICAL' });
    const result = listIssues(input);
    expect(result.items.map((issue) => issue.id)).toEqual(['ISS-1001']);
  });

  it('supports date range and severity sorting', () => {
    const input = issueListSchema.parse({ from: '2026-08-07', to: '2026-08-11', sort: 'severity' });
    const result = listIssues(input);
    expect(result.items.map((issue) => issue.id)).toEqual(['ISS-1002', 'ISS-1004', 'ISS-1003']);
  });

  it('rejects an inverted date range', () => {
    expect(() => issueListSchema.parse({ from: '2026-08-12', to: '2026-08-01' })).toThrow();
  });
});
