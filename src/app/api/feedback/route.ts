import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, authenticateDashboard, getRequestId } from '@/lib/feedback-api';
import { handleApiError } from '@/lib/api';
import { issueListSchema } from '@/schemas/issue';
import { listIssues } from '@/services/issue.service';

/** @deprecated Use /api/issues for the read-only issue list. */
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  const identity = authenticateDashboard(request);
  if (!identity) return errorResponse(requestId, 401, 'invalid_dashboard_api_key', 'A valid dashboard API key is required');

  try {
    const input = issueListSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    if (identity.projectIds && input.project_id && !identity.projectIds.includes(input.project_id)) {
      return errorResponse(requestId, 403, 'project_access_denied', 'The dashboard key cannot access this project');
    }
    return NextResponse.json(await listIssues(input, identity.projectIds), { headers: { 'x-request-id': requestId } });
  } catch (error) {
    return handleApiError(error);
  }
}
