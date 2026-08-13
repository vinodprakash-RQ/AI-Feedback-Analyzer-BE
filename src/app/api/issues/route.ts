import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api';
import { issueListSchema } from '@/schemas/issue';
import { listIssues } from '@/services/issue.service';

export function GET(request: NextRequest) {
  try {
    const input = issueListSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json(listIssues(input));
  } catch (error) {
    return handleApiError(error);
  }
}
