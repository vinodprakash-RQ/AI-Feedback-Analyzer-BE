import { NextResponse } from 'next/server';
import { authenticateDashboard, errorResponse, getRequestId } from '@/lib/feedback-api';
import { issueUpdateSchema } from '@/schemas/issue';
import { getIssue, updateIssueStatus } from '@/services/issue.service';

async function dashboardIdentity(request: Request, requestId: string) {
  const identity = authenticateDashboard(request);
  return identity ?? errorResponse(requestId, 401, 'invalid_dashboard_api_key', 'A valid dashboard API key is required');
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  const identity = await dashboardIdentity(request, requestId);
  if (identity instanceof Response) return identity;

  const issue = await getIssue((await params).id, identity.projectIds);
  return issue ? NextResponse.json(issue, { headers: { 'x-request-id': requestId } }) : errorResponse(requestId, 404, 'issue_not_found', 'Issue not found');
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  const identity = await dashboardIdentity(request, requestId);
  if (identity instanceof Response) return identity;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(requestId, 400, 'invalid_json', 'Request body must be valid JSON');
  }

  const parsed = issueUpdateSchema.safeParse(body);
  if (!parsed.success) return errorResponse(requestId, 422, 'validation_failed', 'status must be NEW, INVESTIGATING, RESOLVED, or CLOSED');

  const issue = await updateIssueStatus((await params).id, parsed.data.status, identity.projectIds);
  return issue ? NextResponse.json(issue, { headers: { 'x-request-id': requestId } }) : errorResponse(requestId, 404, 'issue_not_found', 'Issue not found');
}
