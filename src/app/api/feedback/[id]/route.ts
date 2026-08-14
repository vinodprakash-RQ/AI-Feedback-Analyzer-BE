import { NextResponse } from 'next/server';
import { getIssue } from '@/services/issue.service';

/** @deprecated Use /api/issues/:id for issue details. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const issue = await getIssue((await params).id);
  return issue ? NextResponse.json(issue) : NextResponse.json({ error: 'Issue not found' }, { status: 404 });
}
