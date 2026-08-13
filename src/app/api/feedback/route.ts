import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api';
import { feedbackCreateSchema, feedbackListSchema } from '@/schemas/feedback';
import { createFeedback, listFeedback } from '@/services/feedback.service';

export async function GET(request: NextRequest) {
  try {
    const input = feedbackListSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json(await listFeedback(input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = feedbackCreateSchema.parse(await request.json());
    return NextResponse.json(await createFeedback(input), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
