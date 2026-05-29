/**
 * Moderation Log Utility
 *
 * Records all content moderation actions for moderator review.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModerationAction = 'blocked' | 'approved' | 'removed' | 'flagged';
export type ContentType = 'community_report' | 'answer' | 'question' | 'help_request';

export interface ModerationLogEntry {
  id: string;
  timestamp: string;
  contentType: ContentType;
  contentId?: string;
  userId?: string;
  action: ModerationAction;
  reason?: string;
  blockedTerms?: string[];
  reviewedBy?: string;
}

// ─── In-memory log (replace with DB table in production) ─────────────────────

const moderationLog: ModerationLogEntry[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `mod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Log a moderation action.
 */
export function logModerationAction(
  entry: Omit<ModerationLogEntry, 'id' | 'timestamp'>
): ModerationLogEntry {
  const fullEntry: ModerationLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  moderationLog.push(fullEntry);

  // Keep only last 1000 entries in memory
  if (moderationLog.length > 1000) {
    moderationLog.splice(0, moderationLog.length - 1000);
  }

  return fullEntry;
}

/**
 * Get recent moderation log entries.
 */
export function getModerationLog(limit = 50): ModerationLogEntry[] {
  return moderationLog.slice(-limit).reverse();
}

/**
 * Get moderation log entries for a specific user.
 */
export function getUserModerationHistory(userId: string): ModerationLogEntry[] {
  return moderationLog.filter((e) => e.userId === userId).reverse();
}

/**
 * Get count of blocked content for a user.
 */
export function getUserBlockedCount(userId: string): number {
  return moderationLog.filter(
    (e) => e.userId === userId && e.action === 'blocked'
  ).length;
}
