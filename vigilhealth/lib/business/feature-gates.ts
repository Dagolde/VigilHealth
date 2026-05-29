/**
 * Feature Gating Utility
 *
 * Controls access to features based on subscription tier.
 * Tiers: free < basic < professional < enterprise
 */

import type { BusinessOrganization } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'basic' | 'premium';

export type Feature =
  | 'wellness_dashboard'
  | 'outbreak_detection'
  | 'multi_location'
  | 'health_broadcasts'
  | 'data_export'
  | 'advanced_analytics'
  | 'api_access'
  | 'custom_reports'
  | 'priority_support';

// ─── Feature Matrix ───────────────────────────────────────────────────────────

const FEATURE_REQUIREMENTS: Record<Feature, SubscriptionTier[]> = {
  wellness_dashboard: ['basic', 'premium'],
  outbreak_detection: ['basic', 'premium'],
  multi_location: ['premium'],
  health_broadcasts: ['basic', 'premium'],
  data_export: ['premium'],
  advanced_analytics: ['premium'],
  api_access: ['premium'],
  custom_reports: ['premium'],
  priority_support: ['premium'],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if an organization has access to a specific feature.
 */
export function hasFeatureAccess(
  org: Pick<BusinessOrganization, 'subscription_tier' | 'subscription_expires_at'>,
  feature: Feature
): boolean {
  const tier = org.subscription_tier;

  // Check if subscription is expired
  if (org.subscription_expires_at) {
    const expiresAt = new Date(org.subscription_expires_at);
    if (expiresAt < new Date()) {
      return false;
    }
  }

  const requiredTiers = FEATURE_REQUIREMENTS[feature];
  return requiredTiers.includes(tier);
}

/**
 * Get all features available for a given tier.
 */
export function getFeaturesForTier(tier: SubscriptionTier): Feature[] {
  return (Object.entries(FEATURE_REQUIREMENTS) as [Feature, SubscriptionTier[]][])
    .filter(([, tiers]) => tiers.includes(tier))
    .map(([feature]) => feature);
}

/**
 * Get the minimum tier required for a feature.
 */
export function getMinimumTierForFeature(feature: Feature): SubscriptionTier {
  const tiers = FEATURE_REQUIREMENTS[feature];
  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'premium'];
  return tiers.sort((a, b) => tierOrder.indexOf(a) - tierOrder.indexOf(b))[0] ?? 'premium';
}

/**
 * Check if a subscription is expired.
 */
export function isSubscriptionExpired(
  org: Pick<BusinessOrganization, 'subscription_expires_at'>
): boolean {
  if (!org.subscription_expires_at) return false;
  return new Date(org.subscription_expires_at) < new Date();
}
