/**
 * Free-Tier Usage Monitor
 *
 * Tracks usage of free-tier services and alerts at 80% threshold.
 * Services: Supabase, Mapbox, Resend, Vercel
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceUsage {
  service: string;
  metric: string;
  current: number;
  limit: number;
  percentUsed: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

// ─── Free Tier Limits ─────────────────────────────────────────────────────────

const FREE_TIER_LIMITS = {
  supabase: {
    storageBytes: 500 * 1024 * 1024, // 500 MB
    bandwidthBytes: 2 * 1024 * 1024 * 1024, // 2 GB/month
    mau: 50_000, // Monthly active users
  },
  mapbox: {
    mapLoads: 50_000, // Map loads/month
    geocodingRequests: 100_000, // Geocoding requests/month
  },
  resend: {
    emailsPerDay: 100,
    emailsPerMonth: 3_000,
  },
  vercel: {
    functionInvocations: 100_000, // /month on hobby
    bandwidthBytes: 100 * 1024 * 1024 * 1024, // 100 GB/month
  },
} as const;

const ALERT_THRESHOLD = 0.8; // 80%

// ─── In-memory counters (replace with persistent store in production) ──────────

const counters: Record<string, number> = {
  mapbox_map_loads: 0,
  mapbox_geocoding: 0,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Increment a usage counter.
 */
export function incrementUsage(key: string, amount = 1): void {
  counters[key] = (counters[key] ?? 0) + amount;
}

/**
 * Get usage status for a specific metric.
 */
export function getUsageStatus(key: string, limit: number): ServiceUsage {
  const current = counters[key] ?? 0;
  const percentUsed = (current / limit) * 100;

  return {
    service: key.split('_')[0],
    metric: key,
    current,
    limit,
    percentUsed: Math.round(percentUsed * 10) / 10,
    isNearLimit: current >= limit * ALERT_THRESHOLD,
    isAtLimit: current >= limit,
  };
}

/**
 * Get all usage statuses.
 */
export function getAllUsageStatuses(): ServiceUsage[] {
  return [
    getUsageStatus('mapbox_map_loads', FREE_TIER_LIMITS.mapbox.mapLoads),
    getUsageStatus('mapbox_geocoding', FREE_TIER_LIMITS.mapbox.geocodingRequests),
    getUsageStatus('resend_emails_today', FREE_TIER_LIMITS.resend.emailsPerDay),
  ];
}

/**
 * Check if any service is near its limit and log warnings.
 */
export function checkUsageLimits(): ServiceUsage[] {
  const statuses = getAllUsageStatuses();
  const nearLimit = statuses.filter((s) => s.isNearLimit);

  for (const status of nearLimit) {
    if (status.isAtLimit) {
      console.error(
        `[UsageMonitor] LIMIT REACHED: ${status.metric} at ${status.current}/${status.limit}`
      );
    } else {
      console.warn(
        `[UsageMonitor] Near limit: ${status.metric} at ${status.percentUsed}% (${status.current}/${status.limit})`
      );
    }
  }

  return nearLimit;
}

/**
 * Track a Mapbox map load.
 */
export function trackMapboxLoad(): void {
  incrementUsage('mapbox_map_loads');
  const status = getUsageStatus('mapbox_map_loads', FREE_TIER_LIMITS.mapbox.mapLoads);
  if (status.isNearLimit) {
    console.warn(`[UsageMonitor] Mapbox map loads at ${status.percentUsed}%`);
  }
}
