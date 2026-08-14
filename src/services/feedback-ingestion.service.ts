import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logFeedbackApiEvent } from '@/lib/feedback-api';
import { analyzeFeedbackWithClaude } from '@/services/claude-analysis.service';
import type { FeedbackIngestionInput } from '@/schemas/feedback-ingestion';

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
    const result = await analyzeFeedbackWithClaude(feedback.message);
    await prisma.$transaction([
      prisma.feedbackAnalysis.upsert({
        where: { feedbackId },
        create: { feedbackId, ...result },
        update: { ...result },
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
