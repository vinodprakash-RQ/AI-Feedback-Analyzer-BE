import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api';
import { issueListSchema } from '@/schemas/issue';
import { listIssues } from '@/services/issue.service';

/** @deprecated Use /api/issues for the read-only issue list. */
export async function GET(request: NextRequest) {
  try {
    const input = issueListSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json(await listIssues(input));
  } catch (error) {
    return handleApiError(error);
  }
}
