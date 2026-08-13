import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json(
    { error: 'Dashboard summary is not part of the issue-list module. Use /api/issues.' },
    { status: 410 },
  );
}
