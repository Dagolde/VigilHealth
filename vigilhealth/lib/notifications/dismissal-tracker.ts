/**
 * Notification Dismissal Tracker
 *
 * Records which notifications a user has dismissed to prevent re-sending
 * the same alert. Uses localStorage for client-side persistence.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DismissalRecord {
  notificationId: string;
  userId: string;
  dismissedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'vh_dismissed_notifications';
const MAX_STORED_DISMISSALS = 200;
const DISMISSAL_TTL_DAYS = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadDismissals(): DismissalRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DismissalRecord[];
  } catch {
    return [];
  }
}

function saveDismissals(records: DismissalRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Prune old records
    const cutoff = new Date(Date.now() - DISMISSAL_TTL_DAYS * 24 * 60 * 60 * 1_000).toISOString();
    const pruned = records
      .filter((r) => r.dismissedAt > cutoff)
      .slice(-MAX_STORED_DISMISSALS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record that a user dismissed a notification.
 */
export function recordDismissal(userId: string, notificationId: string): void {
  const records = loadDismissals();
  records.push({
    notificationId,
    userId,
    dismissedAt: new Date().toISOString(),
  });
  saveDismissals(records);
}

/**
 * Check if a user has already dismissed a specific notification.
 */
export function hasDismissed(userId: string, notificationId: string): boolean {
  const records = loadDismissals();
  return records.some(
    (r) => r.userId === userId && r.notificationId === notificationId
  );
}

/**
 * Get all dismissal records for a user.
 */
export function getUserDismissals(userId: string): DismissalRecord[] {
  return loadDismissals().filter((r) => r.userId === userId);
}

/**
 * Clear all dismissals for a user (e.g., on logout).
 */
export function clearUserDismissals(userId: string): void {
  const records = loadDismissals().filter((r) => r.userId !== userId);
  saveDismissals(records);
}
