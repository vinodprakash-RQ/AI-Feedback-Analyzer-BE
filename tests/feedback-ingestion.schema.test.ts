import { describe, expect, it } from 'vitest';
import { feedbackIngestionSchema } from '../src/schemas/feedback-ingestion';

describe('feedback ingestion request', () => {
  it('accepts the third-party payload shape', () => {
    const result = feedbackIngestionSchema.parse({
      message: 'The generated application is failing to build.',
      user_id: 'user_123',
      conversation_id: 'conv_456',
      project_id: 'project_789',
      source: 'ai-builder',
      page_url: 'https://example.com/projects/123',
      metadata: { request_id: 'req_123', environment: 'production' },
    });
    expect(result.message).toContain('failing');
    expect(feedbackIngestionSchema.parse({ message: '  preserve this  ' }).message).toBe('  preserve this  ');
  });

  it('rejects empty and oversized input', () => {
    expect(() => feedbackIngestionSchema.parse({ message: ' ' })).toThrow();
    expect(() => feedbackIngestionSchema.parse({ message: 'x'.repeat(20_001) })).toThrow();
    expect(() => feedbackIngestionSchema.parse({ message: 'valid', metadata: { value: 'x'.repeat(10_001) } })).toThrow();
  });
});
