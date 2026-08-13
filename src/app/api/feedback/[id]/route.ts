import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api';
import { feedbackUpdateSchema } from '@/schemas/feedback';
import { findFeedback, updateFeedback } from '@/services/feedback.service';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const feedback = await findFeedback(id);
  return feedback ? NextResponse.json(feedback) : NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = feedbackUpdateSchema.parse(await request.json());
    return NextResponse.json(await updateFeedback(id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await updateFeedback(id, { status: 'CLOSED' });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
