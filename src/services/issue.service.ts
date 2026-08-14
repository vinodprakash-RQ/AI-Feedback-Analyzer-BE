import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { IssueListInput } from '../schemas/issue';
import type { Issue } from './issue.mock';

const severityRank: Record<Issue['severity'], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
type SubmissionWithAnalysis = Prisma.FeedbackSubmissionGetPayload<{ include: { analysis: true } }>;

function toIssue(submission: SubmissionWithAnalysis): Issue {
  const analysis = submission.analysis;
  const metadata = submission.metadata && typeof submission.metadata === 'object' && !Array.isArray(submission.metadata)
    ? (submission.metadata as Record<string, unknown>)
    : {};

  return {
    id: submission.id,
    summary: analysis?.summary ?? submission.message.slice(0, 160),
    originalFeedback: submission.message,
    aiSummary: analysis?.summary ?? 'Analysis pending',
    category: analysis?.category ?? 'OTHER',
    subcategory: analysis?.subcategory ?? 'Analysis pending',
    sentiment: analysis?.sentiment ?? 'NEUTRAL',
    severity: analysis?.severity ?? 'MEDIUM',
    aiConfidence: analysis?.confidence ?? 0,
    status: submission.issueStatus,
    createdAt: submission.createdAt.toISOString(),
    userReference: submission.userId ?? '',
    projectReference: submission.projectId ?? '',
    conversationId: submission.conversationId ?? '',
    metadata,
  };
}

export async function listIssues(input: IssueListInput) {
  const where: Prisma.FeedbackSubmissionWhereInput = {
    ...(input.category || input.subcategory || input.sentiment || input.severity
      ? {
          analysis: {
            is: {
              ...(input.category ? { category: input.category } : {}),
              ...(input.subcategory ? { subcategory: { equals: input.subcategory, mode: 'insensitive' } } : {}),
              ...(input.sentiment ? { sentiment: input.sentiment } : {}),
              ...(input.severity ? { severity: input.severity } : {}),
            },
          },
        }
      : {}),
    ...(input.status ? { issueStatus: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            { message: { contains: input.search, mode: 'insensitive' } },
            { analysis: { is: { summary: { contains: input.search, mode: 'insensitive' } } } },
          ],
        }
      : {}),
    ...(input.from || input.to
      ? {
          createdAt: {
            ...(input.from ? { gte: new Date(`${input.from}T00:00:00.000Z`) } : {}),
            ...(input.to ? { lte: new Date(`${input.to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const submissions = await prisma.feedbackSubmission.findMany({
    where,
    include: { analysis: true },
    orderBy: { createdAt: input.sort === 'oldest' ? 'asc' : 'desc' },
  });
  const issues = submissions.map(toIssue);

  if (input.sort === 'severity') {
    issues.sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || right.createdAt.localeCompare(left.createdAt));
  }

  const start = (input.page - 1) * input.pageSize;
  return {
    items: issues.slice(start, start + input.pageSize),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: issues.length,
      totalPages: Math.ceil(issues.length / input.pageSize),
    },
  };
}

export async function getIssue(id: string) {
  const submission = await prisma.feedbackSubmission.findUnique({ where: { id }, include: { analysis: true } });
  return submission ? toIssue(submission) : null;
}
