/**
 * Rate Limiting Utility
 *
 * Implements a sliding window rate limiter.
 * Default: 5 requests per second per IP.
 * For production, use Upstash Redis for distributed rate limiting.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateLimitRecord {
  requests: number[];
  blocked: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_MAX_REQUESTS = 5;
const DEFAULT_WINDOW_MS = 1_000; // 1 second

// ─── In-memory store (replace with Redis in production) ───────────────────────

const store: Map<string, RateLimitRecord> = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanOldRequests(record: RateLimitRecord, windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  record.requests = record.requests.filter((ts) => ts > cutoff);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

/**
 * Check if a request from the given key (IP address) is within rate limits.
 */
export function checkRateLimit(
  key: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();

  let record = store.get(key);
  if (!record) {
    record = { requests: [], blocked: false };
    store.set(key, record);
  }

  cleanOldRequests(record, windowMs);

  const remaining = Math.max(0, maxRequests - record.requests.length);
  const resetAt = record.requests.length > 0
    ? record.requests[0] + windowMs
    : now + windowMs;

  if (record.requests.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterMs: resetAt - now,
    };
  }

  record.requests.push(now);

  return {
    allowed: true,
    remaining: remaining - 1,
    resetAt,
  };
}

/**
 * Extract the client IP from a Next.js request.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Clear rate limit records for a key (for testing).
 */
export function clearRateLimit(key: string): void {
  store.delete(key);
}
