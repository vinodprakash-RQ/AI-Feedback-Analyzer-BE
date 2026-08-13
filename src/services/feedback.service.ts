import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { FeedbackCreateInput, FeedbackListInput, FeedbackUpdateInput } from '@/schemas/feedback';

function buildWhere(input: FeedbackListInput): Prisma.FeedbackWhereInput {
  return {
    ...(input.status ? { status: input.status } : {}),
    ...(input.severity ? { severity: input.severity } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.sentiment ? { sentiment: input.sentiment } : {}),
    ...(input.search
      ? {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

export async function listFeedback(input: FeedbackListInput) {
  const where = buildWhere(input);
  const skip = (input.page - 1) * input.pageSize;
  const [items, total] = await Promise.all([
    prisma.feedback.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: input.pageSize }),
    prisma.feedback.count({ where }),
  ]);

  return {
    items,
    pagination: { page: input.page, pageSize: input.pageSize, total, totalPages: Math.ceil(total / input.pageSize) },
  };
}

export function createFeedback(input: FeedbackCreateInput) {
  return prisma.feedback.create({ data: input });
}

export function updateFeedback(id: string, input: FeedbackUpdateInput) {
  return prisma.feedback.update({
    where: { id },
    data: {
      ...input,
      ...(input.status === 'RESOLVED' || input.status === 'CLOSED' ? { resolvedAt: new Date() } : {}),
    },
  });
}

export async function getDashboardSummary() {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  const [total, open, resolved, critical, highSeverity, negativeSentiment, byCategory, bySentiment, bySeverity, reportedItems] =
    await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: 'OPEN' } }),
      prisma.feedback.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.feedback.count({ where: { severity: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.feedback.count({ where: { severity: 'HIGH', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.feedback.count({ where: { sentiment: 'NEGATIVE' } }),
      prisma.feedback.groupBy({ by: ['category'], _count: { _all: true } }),
      prisma.feedback.groupBy({ by: ['sentiment'], _count: { _all: true } }),
      prisma.feedback.groupBy({ by: ['severity'], _count: { _all: true } }),
      prisma.feedback.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    ]);

  const reportedOverTime = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(since);
    date.setDate(since.getDate() + index);
    const day = date.toISOString().slice(0, 10);
    return { date: day, count: reportedItems.filter((item) => item.createdAt.toISOString().slice(0, 10) === day).length };
  });

  return {
    cards: { total, open, resolved, critical, highSeverity, negativeSentiment },
    charts: {
      byCategory: byCategory.map(({ category, _count }) => ({ category, count: _count._all })),
      bySentiment: bySentiment.map(({ sentiment, _count }) => ({ sentiment, count: _count._all })),
      bySeverity: bySeverity.map(({ severity, _count }) => ({ severity, count: _count._all })),
      reportedOverTime,
    },
  };
}

export function findFeedback(id: string) {
  return prisma.feedback.findUnique({ where: { id } });
}
