import { NextResponse } from 'next/server';
import { errorResponse, authenticate, checkRateLimit, getRequestId, idempotencyKey, isUniqueConstraintError, logFeedbackApiEvent, withRequestHeaders } from '@/lib/feedback-api';
import { feedbackIngestionSchema } from '@/schemas/feedback-ingestion';
import { createFeedbackSubmission, enqueueFeedbackAnalysis, findByIdempotencyKey } from '@/services/feedback-ingestion.service';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  if (!process.env.FEEDBACK_API_KEYS?.trim()) {
    return errorResponse(requestId, 503, 'api_not_configured', 'Feedback API authentication is not configured');
  }

  const apiClient = authenticate(request);
  if (!apiClient) return errorResponse(requestId, 401, 'invalid_api_key', 'A valid API key is required');

  const limit = checkRateLimit(apiClient);
  if (!limit.allowed) {
    const response = errorResponse(requestId, 429, 'rate_limit_exceeded', 'Too many requests', 0);
    response.headers.set('retry-after', String(limit.retryAfter));
    return response;
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse(requestId, 400, 'invalid_json', 'Request body must be valid JSON', limit.remaining);
  }

  const parsed = feedbackIngestionSchema.safeParse(input);
  if (!parsed.success) {
    return errorResponse(requestId, 422, 'validation_failed', 'Request body failed validation', limit.remaining);
  }

  const key = idempotencyKey(request);
  if (key) {
    const existing = await findByIdempotencyKey(apiClient, key);
    if (existing) return acknowledgement(existing.id, existing.createdAt, requestId, limit.remaining);
  }

  try {
    const feedback = await createFeedbackSubmission(parsed.data, apiClient, key);
    enqueueFeedbackAnalysis(feedback.id, requestId);
    logFeedbackApiEvent({ event: 'feedback_received', feedback_id: feedback.id, api_client: apiClient, request_id: requestId });
    return acknowledgement(feedback.id, feedback.createdAt, requestId, limit.remaining);
  } catch (error) {
    if (key && isUniqueConstraintError(error)) {
      const existing = await findByIdempotencyKey(apiClient, key);
      if (existing) return acknowledgement(existing.id, existing.createdAt, requestId, limit.remaining);
    }
    logFeedbackApiEvent({ event: 'feedback_receive_failed', api_client: apiClient, request_id: requestId, error: String(error) });
    return errorResponse(requestId, 500, 'feedback_not_received', 'Feedback could not be accepted', limit.remaining);
  }
}

function acknowledgement(feedbackId: string, createdAt: Date, requestId: string, remaining: number) {
  return withRequestHeaders(
    NextResponse.json({ feedback_id: feedbackId, status: 'received', created_at: createdAt.toISOString() }, { status: 202 }),
    requestId,
    remaining,
  );
}
