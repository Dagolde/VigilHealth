/**
 * Email Rate Limiter
 *
 * Tracks daily email send counts and alerts at 80% of the daily limit.
 * Default limit: 100 emails/day (Resend free tier).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 100;
const ALERT_THRESHOLD = 0.8; // 80%

// ─── In-memory store (replace with Redis/KV in production) ────────────────────

let usage: DailyUsage = {
  date: getTodayDate(),
  count: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function resetIfNewDay(): void {
  const today = getTodayDate();
  if (usage.date !== today) {
    usage = { date: today, count: 0 };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if sending an email is allowed under the daily limit.
 */
export function canSendEmail(): boolean {
  resetIfNewDay();
  return usage.count < DAILY_LIMIT;
}

/**
 * Record that an email was sent. Returns true if the alert threshold was crossed.
 */
export function recordEmailSent(): { alertTriggered: boolean; currentCount: number } {
  resetIfNewDay();
  usage.count++;

  const alertTriggered = usage.count === Math.floor(DAILY_LIMIT * ALERT_THRESHOLD);

  if (alertTriggered) {
    console.warn(
      `[EmailRateLimiter] Alert: ${usage.count}/${DAILY_LIMIT} emails sent today (${Math.round(ALERT_THRESHOLD * 100)}% threshold reached)`
    );
  }

  if (usage.count >= DAILY_LIMIT) {
    console.error(
      `[EmailRateLimiter] Daily limit of ${DAILY_LIMIT} emails reached. No more emails will be sent today.`
    );
  }

  return { alertTriggered, currentCount: usage.count };
}

/**
 * Get current daily usage statistics.
 */
export function getDailyUsage(): {
  date: string;
  count: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  isAtLimit: boolean;
  isNearLimit: boolean;
} {
  resetIfNewDay();
  const remaining = Math.max(0, DAILY_LIMIT - usage.count);
  const percentUsed = (usage.count / DAILY_LIMIT) * 100;

  return {
    date: usage.date,
    count: usage.count,
    limit: DAILY_LIMIT,
    remaining,
    percentUsed: Math.round(percentUsed * 10) / 10,
    isAtLimit: usage.count >= DAILY_LIMIT,
    isNearLimit: usage.count >= DAILY_LIMIT * ALERT_THRESHOLD,
  };
}

/**
 * Reset the daily counter (for testing purposes).
 */
export function resetDailyCount(): void {
  usage = { date: getTodayDate(), count: 0 };
}
