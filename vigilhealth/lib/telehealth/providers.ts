/**
 * Telehealth Provider Configuration
 * 
 * Configuration for integrated telehealth partners
 */

import type { TelehealthProvider } from './types';

/**
 * Configured telehealth providers
 * 
 * In production, these would be loaded from environment variables
 * or a database configuration table
 */
export const TELEHEALTH_PROVIDERS: TelehealthProvider[] = [
  {
    id: 'teladoc',
    name: 'Teladoc Health',
    apiEndpoint: process.env.TELADOC_API_ENDPOINT || 'https://api.teladoc.com/v1',
    commissionRate: 25.0, // $25 per referral
    isActive: true,
  },
  {
    id: 'mdlive',
    name: 'MDLive',
    apiEndpoint: process.env.MDLIVE_API_ENDPOINT || 'https://api.mdlive.com/v1',
    commissionRate: 20.0, // $20 per referral
    isActive: true,
  },
  {
    id: 'amwell',
    name: 'Amwell',
    apiEndpoint: process.env.AMWELL_API_ENDPOINT || 'https://api.amwell.com/v1',
    commissionRate: 30.0, // $30 per referral
    isActive: false, // Not yet integrated
  },
];

/**
 * Get active telehealth providers
 */
export function getActiveProviders(): TelehealthProvider[] {
  return TELEHEALTH_PROVIDERS.filter((p) => p.isActive);
}

/**
 * Get provider by ID
 */
export function getProviderById(providerId: string): TelehealthProvider | undefined {
  return TELEHEALTH_PROVIDERS.find((p) => p.id === providerId);
}

/**
 * Get provider commission rate
 */
export function getProviderCommissionRate(providerId: string): number {
  const provider = getProviderById(providerId);
  return provider?.commissionRate || 0;
}
