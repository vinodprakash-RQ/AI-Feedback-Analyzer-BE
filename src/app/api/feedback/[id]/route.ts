import { NextResponse } from 'next/server';
import { authenticateDashboard, errorResponse, getRequestId } from '@/lib/feedback-api';
import { getIssue } from '@/services/issue.service';

/** @deprecated Use /api/issues/:id for issue details. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  const identity = authenticateDashboard(request);
  if (!identity) return errorResponse(requestId, 401, 'invalid_dashboard_api_key', 'A valid dashboard API key is required');

  const issue = await getIssue((await params).id, identity.projectIds);
  return issue ? NextResponse.json(issue, { headers: { 'x-request-id': requestId } }) : errorResponse(requestId, 404, 'issue_not_found', 'Issue not found');
}
