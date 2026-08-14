import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : []),
]);

const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, Idempotency-Key, X-Request-ID',
  'Access-Control-Expose-Headers': 'X-Request-ID, X-RateLimit-Remaining, Retry-After',
  Vary: 'Origin',
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = request.method === 'OPTIONS' ? new NextResponse(null, { status: 204 }) : NextResponse.next();

  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  if (origin && allowedOrigins.has(origin)) response.headers.set('Access-Control-Allow-Origin', origin);

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
