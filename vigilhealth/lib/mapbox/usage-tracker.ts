/**
 * Mapbox usage tracking utility
 *
 * Tracks map load counts in localStorage to stay within the 50K free tier.
 * Resets daily and alerts (console.warn) when count reaches 40K (80% of limit).
 */

const STORAGE_KEY_COUNT = 'mapbox_load_count';
const STORAGE_KEY_DATE = 'mapbox_load_date';
const ALERT_THRESHOLD = 40_000;
const FREE_TIER_LIMIT = 50_000;

export interface MapboxUsageStats {
  count: number;
  date: string;
  percentUsed: number;
  isNearLimit: boolean;
}

/**
 * Returns today's date as YYYY-MM-DD string.
 */
function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Reads the current count and date from localStorage.
 * Returns { count: 0, date: today } if not set or if running server-side.
 */
function readStorage(): { count: number; date: string } {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { count: 0, date: getTodayString() };
  }

  const storedDate = localStorage.getItem(STORAGE_KEY_DATE) ?? getTodayString();
  const storedCount = parseInt(localStorage.getItem(STORAGE_KEY_COUNT) ?? '0', 10);

  return {
    count: isNaN(storedCount) ? 0 : storedCount,
    date: storedDate,
  };
}

/**
 * Writes count and date to localStorage.
 */
function writeStorage(count: number, date: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY_COUNT, String(count));
  localStorage.setItem(STORAGE_KEY_DATE, date);
}

/**
 * Tracks a single Mapbox map load.
 * - Resets count if the stored date differs from today.
 * - Increments count.
 * - Emits console.warn when count reaches ALERT_THRESHOLD.
 *
 * @returns The updated usage stats after tracking this load.
 */
export function trackMapboxLoad(): MapboxUsageStats {
  const today = getTodayString();
  const { count: storedCount, date: storedDate } = readStorage();

  // Reset daily
  const count = storedDate === today ? storedCount : 0;
  const newCount = count + 1;

  writeStorage(newCount, today);

  if (newCount >= ALERT_THRESHOLD) {
    console.warn(
      `[VigilHealth] Mapbox usage alert: ${newCount.toLocaleString()} map loads today ` +
        `(${Math.round((newCount / FREE_TIER_LIMIT) * 100)}% of ${FREE_TIER_LIMIT.toLocaleString()} free tier limit). ` +
        `Consider reducing map loads to stay within the free tier.`
    );
  }

  return {
    count: newCount,
    date: today,
    percentUsed: Math.round((newCount / FREE_TIER_LIMIT) * 100),
    isNearLimit: newCount >= ALERT_THRESHOLD,
  };
}

/**
 * Returns current Mapbox usage stats without incrementing the count.
 * Resets to zero if the stored date is not today.
 */
export function getMapboxUsageStats(): MapboxUsageStats {
  const today = getTodayString();
  const { count: storedCount, date: storedDate } = readStorage();

  const count = storedDate === today ? storedCount : 0;

  return {
    count,
    date: today,
    percentUsed: Math.round((count / FREE_TIER_LIMIT) * 100),
    isNearLimit: count >= ALERT_THRESHOLD,
  };
}

/**
 * Resets the usage counter (useful for testing or manual resets).
 */
export function resetMapboxUsageStats(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEY_COUNT);
  localStorage.removeItem(STORAGE_KEY_DATE);
}
