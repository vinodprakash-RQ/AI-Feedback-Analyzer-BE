import type { IssueCategory, IssueSentiment, IssueSeverity, IssueStatus } from '@/schemas/issue';

export interface Issue {
  id: string;
  summary: string;
  originalFeedback: string;
  aiSummary: string;
  category: IssueCategory;
  subcategory: string;
  sentiment: IssueSentiment;
  severity: IssueSeverity;
  aiConfidence: number;
  status: IssueStatus;
  createdAt: string;
  userReference: string;
  projectReference: string;
  conversationId: string;
  metadata: Record<string, unknown>;
}

export const mockIssues: Issue[] = [
  {
    id: 'ISS-1001',
    summary: 'Generated application fails during build',
    originalFeedback: 'The generated app looks correct, but the build fails with a module resolution error.',
    aiSummary: 'Generated project cannot resolve a dependency during production build.',
    category: 'BUILD_FAILURE',
    subcategory: 'Module resolution',
    sentiment: 'FRUSTRATED',
    severity: 'CRITICAL',
    aiConfidence: 0.96,
    status: 'INVESTIGATING',
    createdAt: '2026-08-12T14:30:00.000Z',
    userReference: 'user_2048',
    projectReference: 'project_alpha',
    conversationId: 'conversation_9001',
    metadata: { browser: 'Chrome 126', environment: 'production' },
  },
  {
    id: 'ISS-1002',
    summary: 'AI response ignores requested API format',
    originalFeedback: 'I asked for a JSON response but received a prose explanation instead.',
    aiSummary: 'Assistant output does not follow the requested response format.',
    category: 'AI_RESPONSE',
    subcategory: 'Instruction following',
    sentiment: 'NEGATIVE',
    severity: 'HIGH',
    aiConfidence: 0.91,
    status: 'NEW',
    createdAt: '2026-08-11T09:15:00.000Z',
    userReference: 'user_1182',
    projectReference: 'project_beta',
    conversationId: 'conversation_9002',
    metadata: { model: 'feedback-analyzer', channel: 'in-app' },
  },
  {
    id: 'ISS-1003',
    summary: 'Sign-in screen has confusing error copy',
    originalFeedback: 'The login failed, but the message does not tell me what to do next.',
    aiSummary: 'Authentication error state lacks actionable guidance.',
    category: 'AUTHENTICATION',
    subcategory: 'Error messaging',
    sentiment: 'NEGATIVE',
    severity: 'MEDIUM',
    aiConfidence: 0.88,
    status: 'RESOLVED',
    createdAt: '2026-08-09T16:45:00.000Z',
    userReference: 'user_0731',
    projectReference: 'project_gamma',
    conversationId: 'conversation_9003',
    metadata: { browser: 'Safari 17', environment: 'staging' },
  },
  {
    id: 'ISS-1004',
    summary: 'Dashboard takes too long to load',
    originalFeedback: 'The dashboard spinner stays visible for almost ten seconds on every visit.',
    aiSummary: 'Dashboard initial load latency is above an acceptable threshold.',
    category: 'PERFORMANCE',
    subcategory: 'Initial load',
    sentiment: 'FRUSTRATED',
    severity: 'HIGH',
    aiConfidence: 0.94,
    status: 'NEW',
    createdAt: '2026-08-07T11:20:00.000Z',
    userReference: 'user_4410',
    projectReference: 'project_delta',
    conversationId: 'conversation_9004',
    metadata: { browser: 'Firefox 128', region: 'eu-west-1' },
  },
  {
    id: 'ISS-1005',
    summary: 'Generated UI needs better mobile spacing',
    originalFeedback: 'The generated page works on my phone, but the controls are cramped and hard to tap.',
    aiSummary: 'Generated mobile layout has insufficient spacing around interactive controls.',
    category: 'UI_UX',
    subcategory: 'Responsive layout',
    sentiment: 'NEUTRAL',
    severity: 'LOW',
    aiConfidence: 0.86,
    status: 'CLOSED',
    createdAt: '2026-08-05T08:00:00.000Z',
    userReference: 'user_3204',
    projectReference: 'project_epsilon',
    conversationId: 'conversation_9005',
    metadata: { device: 'iPhone 15', channel: 'in-app' },
  },
];
