import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { logFeedbackApiEvent } from '@/lib/feedback-api';
import { analyzeFeedbackWithGemini } from '@/services/gemini-analysis.service';
import type { FeedbackIngestionInput } from '@/schemas/feedback-ingestion';

const MAX_ANALYSIS_ATTEMPTS = 3;
const GEMINI_DAILY_LIMIT = 10;
const LOCK_TIMEOUT_MS = 10 * 60 * 1000;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000];

type SubmissionWithRun = Prisma.FeedbackSubmissionGetPayload<{ include: { analysisRuns: true } }>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
  return value;
}

export function feedbackFingerprint(input: FeedbackIngestionInput) {
  return createHash('sha256').update(JSON.stringify(canonicalize(input))).digest('hex');
}

export async function createFeedbackSubmission(input: FeedbackIngestionInput, apiClient: string, idempotencyKey?: string, fingerprint?: string) {
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
      idempotencyFingerprint: fingerprint,
      analysisRuns: { create: {} },
    },
    select: { id: true, status: true, createdAt: true },
  });
}

export async function findByIdempotencyKey(apiClient: string, key: string) {
  return prisma.feedbackSubmission.findUnique({
    where: { apiClient_idempotencyKey: { apiClient, idempotencyKey: key } },
    select: { id: true, status: true, createdAt: true, idempotencyFingerprint: true },
  });
}

function latestRun(submission: SubmissionWithRun) {
  return [...submission.analysisRuns].sort((left, right) => right.attempt - left.attempt)[0];
}

async function reserveGeminiDailySlot() {
  const rows = await prisma.$queryRaw<Array<{ processedCount: number }>>`
    INSERT INTO "GeminiDailyUsage" ("day", "processedCount", "updatedAt")
    VALUES (CURRENT_DATE, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("day") DO UPDATE
      SET "processedCount" = "GeminiDailyUsage"."processedCount" + 1,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "GeminiDailyUsage"."processedCount" < ${GEMINI_DAILY_LIMIT}
    RETURNING "processedCount"
  `;
  return rows.length > 0;
}

async function claimNextAnalysisJob() {
  const now = new Date();
  await prisma.feedbackAnalysisRun.updateMany({
    where: { status: 'PROCESSING', lockedAt: { lt: new Date(now.getTime() - LOCK_TIMEOUT_MS) } },
    data: { status: 'PENDING', lockedAt: null, nextAttemptAt: now },
  });

  const candidate = await prisma.feedbackAnalysisRun.findFirst({
    where: { status: 'PENDING', nextAttemptAt: { lte: now }, attempt: { lte: MAX_ANALYSIS_ATTEMPTS } },
    orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
  });
  if (!candidate) return null;

  const claimed = await prisma.feedbackAnalysisRun.updateMany({
    where: { id: candidate.id, status: 'PENDING' },
    data: { status: 'PROCESSING', lockedAt: now },
  });
  if (claimed.count !== 1) return null;

  if (!(await reserveGeminiDailySlot())) {
    await prisma.$transaction([
      prisma.feedbackAnalysisRun.update({
        where: { id: candidate.id },
        data: { status: 'PENDING', lockedAt: null },
      }),
      prisma.feedbackSubmission.update({
        where: { id: candidate.feedbackId },
        data: { status: candidate.attempt === 1 ? 'RECEIVED' : 'PROCESSING' },
      }),
    ]);
    return null;
  }

  await prisma.feedbackSubmission.update({ where: { id: candidate.feedbackId }, data: { status: 'PROCESSING' } });
  return candidate.id;
}

export async function processFeedbackAnalysis(runId: string, requestId = 'worker') {
  const run = await prisma.feedbackAnalysisRun.findUnique({ where: { id: runId }, include: { feedback: true } });
  if (!run || run.status !== 'PROCESSING') return;

  try {
    const result = await analyzeFeedbackWithGemini(run.feedback.message);
    await prisma.$transaction([
      prisma.feedbackAnalysisRun.update({
        where: { id: runId },
        data: {
          ...result,
          status: 'COMPLETED',
          completedAt: new Date(),
          lockedAt: null,
          errorCode: null,
          errorMessage: null,
        },
      }),
      prisma.feedbackSubmission.update({ where: { id: run.feedbackId }, data: { status: 'COMPLETED' } }),
    ]);
    logFeedbackApiEvent({ event: 'feedback_analysis_completed', feedback_id: run.feedbackId, run_id: runId, request_id: requestId });
  } catch (error) {
    const retryable = run.attempt < MAX_ANALYSIS_ATTEMPTS;
    const errorCode = retryable ? 'provider_retryable' : 'provider_failed';
    const errorMessage = error instanceof Error ? error.message.slice(0, 500) : 'Unknown analysis error';
    await prisma.$transaction(async (transaction) => {
      await transaction.feedbackAnalysisRun.update({
        where: { id: runId },
        data: { status: 'FAILED', nextAttemptAt: new Date(), lockedAt: null, errorCode, errorMessage },
      });
      await transaction.feedbackSubmission.update({
        where: { id: run.feedbackId },
        data: { status: retryable ? 'PROCESSING' : 'FAILED' },
      });
      if (retryable) {
        await transaction.feedbackAnalysisRun.create({
          data: {
            feedbackId: run.feedbackId,
            attempt: run.attempt + 1,
            nextAttemptAt: new Date(Date.now() + RETRY_DELAYS_MS[run.attempt - 1]),
          },
        });
      }
    });
    logFeedbackApiEvent({ event: 'feedback_analysis_failed', feedback_id: run.feedbackId, run_id: runId, request_id: requestId, retryable });
  }
}

export async function processNextAnalysisJob(requestId = 'worker') {
  const runId = await claimNextAnalysisJob();
  if (!runId) return false;
  await processFeedbackAnalysis(runId, requestId);
  return true;
}

export async function processPendingAnalysisJobs(requestId = 'worker', maxJobs = 10) {
  let processed = 0;
  while (processed < maxJobs && await processNextAnalysisJob(requestId)) processed += 1;
  return processed;
}

export function getLatestAnalysis(submission: SubmissionWithRun) {
  return latestRun(submission);
}
