import { mockIssues, type Issue } from './issue.mock';
import type { IssueListInput } from '../schemas/issue';

const severityRank: Record<Issue['severity'], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function listIssues(input: IssueListInput) {
  const search = input.search?.toLowerCase();
  const from = input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined;
  const to = input.to ? new Date(`${input.to}T23:59:59.999Z`) : undefined;

  const filtered = mockIssues.filter((issue) => {
    const createdAt = new Date(issue.createdAt);
    const matchesSearch = !search || `${issue.summary} ${issue.originalFeedback}`.toLowerCase().includes(search);
    return (
      matchesSearch &&
      (!input.category || issue.category === input.category) &&
      (!input.subcategory || issue.subcategory.toLowerCase() === input.subcategory.toLowerCase()) &&
      (!input.sentiment || issue.sentiment === input.sentiment) &&
      (!input.severity || issue.severity === input.severity) &&
      (!input.status || issue.status === input.status) &&
      (!from || createdAt >= from) &&
      (!to || createdAt <= to)
    );
  });

  filtered.sort((left, right) => {
    if (input.sort === 'severity') return severityRank[left.severity] - severityRank[right.severity] || right.createdAt.localeCompare(left.createdAt);
    const direction = input.sort === 'oldest' ? 1 : -1;
    return direction * left.createdAt.localeCompare(right.createdAt);
  });

  const start = (input.page - 1) * input.pageSize;
  return {
    items: filtered.slice(start, start + input.pageSize),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / input.pageSize),
    },
  };
}

export function getIssue(id: string) {
  return mockIssues.find((issue) => issue.id === id) ?? null;
}
