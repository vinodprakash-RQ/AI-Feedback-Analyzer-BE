import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
  }
  if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
  }
  console.error(JSON.stringify({ event: 'api_error', error_type: error instanceof Error ? error.name : 'unknown' }));
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
