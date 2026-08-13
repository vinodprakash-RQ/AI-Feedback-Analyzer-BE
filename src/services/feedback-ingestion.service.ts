import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logFeedbackApiEvent } from '@/lib/feedback-api';
import type { FeedbackIngestionInput } from '@/schemas/feedback-ingestion';

function classify(message: string) {
  const text = message.toLowerCase();
  const frustrated = /fail|broken|cannot|can't|error|slow|frustrat/.test(text);
  const feature = /feature|request|would like|add /.test(text);
  const build = /build|compile|module/.test(text);
  const auth = /login|sign in|password|auth/.test(text);
  const performance = /slow|latency|timeout|loading/.test(text);

  return {
    sentiment: frustrated ? 'FRUSTRATED' as const : 'NEUTRAL' as const,
    intent: feature ? 'FEATURE_REQUEST' as const : build || auth || performance ? 'BUG_REPORT' as const : 'OTHER' as const,
    category: build ? 'BUILD_FAILURE' as const : auth ? 'AUTHENTICATION' as const : performance ? 'PERFORMANCE' as const : 'OTHER' as const,
    subcategory: build ? 'Build pipeline' : auth ? 'Authentication flow' : performance ? 'Response time' : 'Uncategorized',
    severity: /critical|production|data loss/.test(text) ? 'CRITICAL' as const : frustrated ? 'HIGH' as const : 'MEDIUM' as const,
    summary: message.length > 160 ? `${message.slice(0, 157)}...` : message,
    confidence: frustrated || feature || build || auth || performance ? 0.72 : 0.4,
  };
}

export async function createFeedbackSubmission(input: FeedbackIngestionInput, apiClient: string, idempotencyKey?: string) {
  return prisma.feedbackSubmission.create({
    data: {
      message: input.message,
      userId: input.user_id,
      conversationId: input.conversation_id,
      projectId: input.project_id,
      source: input.source,
      pageUrl: input.page_url,
      userAgent: input.user_agent,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      apiClient,
      idempotencyKey,
    },
    select: { id: true, status: true, createdAt: true },
  });
}

export async function findByIdempotencyKey(apiClient: string, key: string) {
  return prisma.feedbackSubmission.findUnique({
    where: { apiClient_idempotencyKey: { apiClient, idempotencyKey: key } },
    select: { id: true, status: true, createdAt: true },
  });
}

export async function processFeedbackAnalysis(feedbackId: string, requestId: string) {
  try {
    const feedback = await prisma.feedbackSubmission.findUnique({ where: { id: feedbackId } });
    if (!feedback) return;
    await prisma.feedbackSubmission.update({ where: { id: feedbackId }, data: { status: 'PROCESSING' } });
    const result = classify(feedback.message);
    await prisma.$transaction([
      prisma.feedbackAnalysis.upsert({
        where: { feedbackId },
        create: { feedbackId, ...result, model: 'rule-based-placeholder', promptVersion: 'v1' },
        update: { ...result, model: 'rule-based-placeholder', promptVersion: 'v1' },
      }),
      prisma.feedbackSubmission.update({ where: { id: feedbackId }, data: { status: 'COMPLETED' } }),
    ]);
    logFeedbackApiEvent({ event: 'feedback_analysis_completed', feedback_id: feedbackId, request_id: requestId });
  } catch (error) {
    await prisma.feedbackSubmission.update({ where: { id: feedbackId }, data: { status: 'FAILED' } }).catch(() => undefined);
    logFeedbackApiEvent({ event: 'feedback_analysis_failed', feedback_id: feedbackId, request_id: requestId, error: String(error) });
  }
}

export function enqueueFeedbackAnalysis(feedbackId: string, requestId: string) {
  queueMicrotask(() => void processFeedbackAnalysis(feedbackId, requestId));
}
