import { describe, expect, it } from 'vitest';
import { issueCategory, issueSentiment, issueSeverity, issueStatus } from '../src/schemas/issue';

describe('issue dimensions', () => {
  it('supports the dashboard category, sentiment, severity, and status values', () => {
    expect(issueCategory.parse('APPLICATION_GENERATION')).toBe('APPLICATION_GENERATION');
    expect(issueSentiment.parse('NEGATIVE')).toBe('NEGATIVE');
    expect(issueSeverity.parse('CRITICAL')).toBe('CRITICAL');
    expect(issueStatus.parse('INVESTIGATING')).toBe('INVESTIGATING');
  });
});
