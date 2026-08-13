import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api';
import { getDashboardSummary } from '@/services/feedback.service';

export async function GET() {
  try {
    return NextResponse.json(await getDashboardSummary());
  } catch (error) {
    return handleApiError(error);
  }
}
