import { afterEach, describe, expect, it } from 'vitest';
import { authenticate, authenticateDashboard } from '../src/lib/feedback-api';

const originalFeedbackKeys = process.env.FEEDBACK_API_KEYS;
const originalDashboardKeys = process.env.DASHBOARD_API_KEYS;

afterEach(() => {
  process.env.FEEDBACK_API_KEYS = originalFeedbackKeys;
  process.env.DASHBOARD_API_KEYS = originalDashboardKeys;
});

describe('feedback API authentication', () => {
  it('authenticates configured ingestion keys', () => {
    process.env.FEEDBACK_API_KEYS = 'ingest-secret';
    expect(authenticate(new Request('http://localhost', { headers: { 'x-api-key': 'ingest-secret' } }))).toBe('client_1');
    expect(authenticate(new Request('http://localhost', { headers: { 'x-api-key': 'wrong' } }))).toBeNull();
  });

  it('enforces dashboard project permissions', () => {
    process.env.DASHBOARD_API_KEYS = 'dashboard-secret=project_a|project_b,admin-secret=*';
    expect(authenticateDashboard(new Request('http://localhost', { headers: { 'x-api-key': 'dashboard-secret' } }))).toEqual({
      client: 'dashboard_1',
      projectIds: ['project_a', 'project_b'],
    });
    expect(authenticateDashboard(new Request('http://localhost', { headers: { 'x-api-key': 'admin-secret' } }))).toEqual({
      client: 'dashboard_2',
      projectIds: null,
    });
  });
});
