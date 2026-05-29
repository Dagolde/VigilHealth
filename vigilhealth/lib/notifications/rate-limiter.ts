/**
 * Notification Rate Limiter
 *
 * Limits notifications to max 3 per day per user.
 * Critical alerts bypass the rate limit.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserNotificationRecord {
  date: string; // YYYY-MM-DD
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NOTIFICATIONS_PER_DAY = 3;

// ─── In-memory store (replace with Redis/KV in production) ────────────────────

const userRecords: Map<string, UserNotificationRecord> = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOrCreateRecord(userId: string): UserNotificationRecord {
  const today = getTodayDate();
  const existing = userRecords.get(userId);

  if (!existing || existing.date !== today) {
    const fresh: UserNotificationRecord = { date: today, count: 0 };
    userRecords.set(userId, fresh);
    return fresh;
  }

  return existing;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if a notification can be sent to a user.
 * Critical alerts always return true.
 */
export function canSendNotification(userId: string, isCritical = false): boolean {
  if (isCritical) return true;

  const record = getOrCreateRecord(userId);
  return record.count < MAX_NOTIFICATIONS_PER_DAY;
}

/**
 * Record that a notification was sent to a user.
 * Returns the updated count.
 */
export function recordNotificationSent(userId: string): number {
  const record = getOrCreateRecord(userId);
  record.count++;
  userRecords.set(userId, record);
  return record.count;
}

/**
 * Get the current notification count for a user today.
 */
export function getNotificationCount(userId: string): number {
  const record = getOrCreateRecord(userId);
  return record.count;
}

/**
 * Get remaining notifications for a user today.
 */
export function getRemainingNotifications(userId: string): number {
  const record = getOrCreateRecord(userId);
  return Math.max(0, MAX_NOTIFICATIONS_PER_DAY - record.count);
}

/**
 * Reset notification count for a user (for testing).
 */
export function resetUserNotifications(userId: string): void {
  userRecords.delete(userId);
}
