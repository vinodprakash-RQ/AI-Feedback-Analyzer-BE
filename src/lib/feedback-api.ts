import { createHash, randomUUID } from 'node:crypto';

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function getRequestId(request: Request) {
  const supplied = request.headers.get('x-request-id');
  return supplied && /^[a-zA-Z0-9._:-]{1,100}$/.test(supplied) ? supplied : randomUUID();
}

export function authenticate(request: Request) {
  const configuredKeys = (process.env.FEEDBACK_API_KEYS ?? '').split(',').map((key) => key.trim()).filter(Boolean);
  const supplied = request.headers.get('x-api-key') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!supplied || configuredKeys.length === 0) return null;

  const suppliedHash = createHash('sha256').update(supplied).digest('hex');
  const client = configuredKeys.find((key) => createHash('sha256').update(key).digest('hex') === suppliedHash);
  return client ? `client_${configuredKeys.indexOf(client) + 1}` : null;
}

export function checkRateLimit(client: string) {
  const now = Date.now();
  const current = requestCounts.get(client);
  if (!current || current.resetAt <= now) {
    requestCounts.set(client, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, retryAfter: 0 };
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }
  current.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - current.count, retryAfter: 0 };
}

export function logFeedbackApiEvent(event: Record<string, unknown>) {
  console.info(JSON.stringify({ service: 'feedback-api', timestamp: new Date().toISOString(), ...event }));
}

export function withRequestHeaders(response: Response, requestId: string, remaining?: number) {
  response.headers.set('x-request-id', requestId);
  if (remaining !== undefined) response.headers.set('x-ratelimit-remaining', String(remaining));
  return response;
}

export function errorResponse(requestId: string, status: number, code: string, message: string, remaining?: number) {
  return withRequestHeaders(
    Response.json({ error: { code, message, request_id: requestId } }, { status }),
    requestId,
    remaining,
  );
}

export function idempotencyKey(request: Request) {
  const key = request.headers.get('idempotency-key');
  return key && key.length <= 255 ? key : undefined;
}

export function isUniqueConstraintError(error: unknown) {
  return error && typeof error === 'object' && 'code' in error && error.code === 'P2002';
}

export { randomUUID };
export const RATE_LIMIT = MAX_REQUESTS_PER_WINDOW;
export const RATE_LIMIT_WINDOW_SECONDS = WINDOW_MS / 1000;
