import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { IssueListInput } from '../schemas/issue';
import type { Issue } from './issue.mock';

const severityRank: Record<Issue['severity'], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
type SubmissionWithAnalysis = Prisma.FeedbackSubmissionGetPayload<{ include: { analysisRuns: { where: { status: 'COMPLETED' }; orderBy: { attempt: 'desc' }; take: 1 } } }>;

function toIssue(submission: SubmissionWithAnalysis): Issue {
  const analysis = submission.analysisRuns[0];
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

export async function listIssues(input: IssueListInput, authorizedProjectIds: string[] | null = null) {
  const analysisFilter: Prisma.FeedbackAnalysisRunWhereInput = {
    status: 'COMPLETED',
    ...(input.category ? { category: input.category } : {}),
    ...(input.subcategory ? { subcategory: { equals: input.subcategory, mode: 'insensitive' } } : {}),
    ...(input.sentiment ? { sentiment: input.sentiment } : {}),
    ...(input.severity ? { severity: input.severity } : {}),
  };
  const where: Prisma.FeedbackSubmissionWhereInput = {
    ...(input.project_id ? { projectId: input.project_id } : authorizedProjectIds ? { projectId: { in: authorizedProjectIds } } : {}),
    ...(input.status ? { issueStatus: input.status } : {}),
    ...(input.category || input.subcategory || input.sentiment || input.severity ? { analysisRuns: { some: analysisFilter } } : {}),
    ...(input.search
      ? {
          OR: [
            { message: { contains: input.search, mode: 'insensitive' } },
            { analysisRuns: { some: { status: 'COMPLETED', summary: { contains: input.search, mode: 'insensitive' } } } },
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
  const include = { analysisRuns: { where: { status: 'COMPLETED' as const }, orderBy: { attempt: 'desc' as const }, take: 1 } };
  const skip = (input.page - 1) * input.pageSize;
  const orderBy = input.sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const };

  if (input.sort !== 'severity') {
    const [submissions, total] = await prisma.$transaction([
      prisma.feedbackSubmission.findMany({ where, include, orderBy, skip, take: input.pageSize }),
      prisma.feedbackSubmission.count({ where }),
    ]);
    return {
      items: submissions.map(toIssue),
      pagination: { page: input.page, pageSize: input.pageSize, total, totalPages: Math.ceil(total / input.pageSize) },
    };
  }

  // Severity ordering is derived from the latest analysis run. Keep this bounded
  // until severity is denormalized onto FeedbackSubmission for database sorting.
  const submissions = await prisma.feedbackSubmission.findMany({ where, include, orderBy: { createdAt: 'desc' }, take: 10_000 });
  const issues = submissions.map(toIssue).sort((left, right) => severityRank[left.severity] - severityRank[right.severity] || right.createdAt.localeCompare(left.createdAt));
  return {
    items: issues.slice(skip, skip + input.pageSize),
    pagination: { page: input.page, pageSize: input.pageSize, total: issues.length, totalPages: Math.ceil(issues.length / input.pageSize) },
  };
}

export async function updateIssueStatus(id: string, status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED', authorizedProjectIds: string[] | null = null) {
  const existing = await prisma.feedbackSubmission.findFirst({
    where: { id, ...(authorizedProjectIds ? { projectId: { in: authorizedProjectIds } } : {}) },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.feedbackSubmission.update({ where: { id }, data: { issueStatus: status } });
  return getIssue(id, authorizedProjectIds);
}

export async function getIssue(id: string, authorizedProjectIds: string[] | null = null, requestedProjectId?: string) {
  const projectId = requestedProjectId ?? (authorizedProjectIds && authorizedProjectIds.length === 1 ? authorizedProjectIds[0] : undefined);
  const submission = await prisma.feedbackSubmission.findFirst({
    where: {
      id,
      ...(projectId ? { projectId } : authorizedProjectIds ? { projectId: { in: authorizedProjectIds } } : {}),
    },
    include: { analysisRuns: { where: { status: 'COMPLETED' }, orderBy: { attempt: 'desc' }, take: 1 } },
  });
  return submission ? toIssue(submission) : null;
}
