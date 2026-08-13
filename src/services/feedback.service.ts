import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { FeedbackCreateInput, FeedbackListInput, FeedbackUpdateInput } from '@/schemas/feedback';

export async function listFeedback(input: FeedbackListInput) {
  const where: Prisma.FeedbackWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.search
      ? { OR: [{ title: { contains: input.search, mode: 'insensitive' } }, { description: { contains: input.search, mode: 'insensitive' } }] }
      : {}),
  };
  const skip = (input.page - 1) * input.pageSize;
  const [items, total] = await Promise.all([
    prisma.feedback.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: input.pageSize }),
    prisma.feedback.count({ where }),
  ]);

  return { items, pagination: { page: input.page, pageSize: input.pageSize, total, totalPages: Math.ceil(total / input.pageSize) } };
}

export function createFeedback(input: FeedbackCreateInput) {
  return prisma.feedback.create({ data: input });
}

export function updateFeedback(id: string, input: FeedbackUpdateInput) {
  return prisma.feedback.update({
    where: { id },
    data: { ...input, ...(input.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}) },
  });
}

export async function getDashboardSummary() {
  const [total, open, inProgress, resolved, critical, byCategory] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.count({ where: { status: 'OPEN' } }),
    prisma.feedback.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.feedback.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
    prisma.feedback.count({ where: { priority: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    prisma.feedback.groupBy({ by: ['category'], _count: { _all: true } }),
  ]);

  return {
    total,
    open,
    inProgress,
    resolved,
    critical,
    byCategory: Object.fromEntries(byCategory.map(({ category, _count }) => [category, _count._all])),
  };
}

export async function findFeedback(id: string) {
  return prisma.feedback.findUnique({ where: { id } });
}
