/**
 * Graceful Degradation Utility
 *
 * Implements fallback behavior when free-tier limits are approached (80% threshold).
 * Ensures the app remains functional even when external services are limited.
 */

import { checkUsageLimits } from './usage-monitor';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DegradationState {
  mapboxDegraded: boolean;
  emailDegraded: boolean;
  realtimeDegraded: boolean;
  message?: string;
}

// ─── State ────────────────────────────────────────────────────────────────────

let degradationState: DegradationState = {
  mapboxDegraded: false,
  emailDegraded: false,
  realtimeDegraded: false,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check current degradation state and update based on usage limits.
 */
export function updateDegradationState(): DegradationState {
  const nearLimitServices = checkUsageLimits();

  const mapboxNearLimit = nearLimitServices.some((s) => s.metric.startsWith('mapbox'));
  const emailNearLimit = nearLimitServices.some((s) => s.metric.startsWith('resend'));

  degradationState = {
    mapboxDegraded: mapboxNearLimit,
    emailDegraded: emailNearLimit,
    realtimeDegraded: false, // Supabase Realtime has generous limits
    message: nearLimitServices.length > 0
      ? `Some features may be limited due to usage thresholds: ${nearLimitServices.map((s) => s.service).join(', ')}`
      : undefined,
  };

  return degradationState;
}

/**
 * Get the current degradation state without updating.
 */
export function getDegradationState(): DegradationState {
  return { ...degradationState };
}

/**
 * Check if a specific feature should be degraded.
 */
export function isFeatureDegraded(feature: keyof DegradationState): boolean {
  if (feature === 'message') return false;
  return Boolean(degradationState[feature]);
}

/**
 * Execute a function with a fallback if the primary fails or is degraded.
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => T | Promise<T>,
  isDegraded = false
): Promise<T> {
  if (isDegraded) {
    return fallback();
  }

  try {
    return await primary();
  } catch (error) {
    console.warn('[GracefulDegradation] Primary failed, using fallback:', error);
    return fallback();
  }
}

/**
 * Get a user-friendly message for degraded features.
 */
export function getDegradationMessage(feature: 'map' | 'email' | 'realtime'): string {
  switch (feature) {
    case 'map':
      return 'Interactive map is temporarily unavailable. Location data is still accessible in list view.';
    case 'email':
      return 'Email notifications are temporarily paused. You can still view alerts in the app.';
    case 'realtime':
      return 'Real-time updates are temporarily unavailable. Please refresh to see the latest data.';
  }
}
