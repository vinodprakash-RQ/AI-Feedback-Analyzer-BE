import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  if (!process.env.DATABASE_URL || !process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) {
    return NextResponse.json({ status: 'not_ready' }, { status: 503 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ready' });
  } catch {
    return NextResponse.json({ status: 'not_ready' }, { status: 503 });
  }
}
