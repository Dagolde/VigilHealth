/**
 * WHO Data Cache
 * 
 * Implements 6-hour cache for WHO data with fallback to cached data on API failure.
 * Uses in-memory cache for simplicity (can be replaced with Redis in production).
 */

import type { InternalRiskData } from '../external/who-data-mapper';

interface CacheEntry {
  data: InternalRiskData[];
  timestamp: number;
  expiresAt: number;
}

// In-memory cache (will be reset on server restart)
// In production, use Redis or similar persistent cache
let cache: CacheEntry | null = null;

// 6 hours in milliseconds
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * Gets cached WHO data if available and not expired
 * @returns Cached data or null if not available or expired
 */
export function getCachedWHOData(): InternalRiskData[] | null {
  if (!cache) {
    return null;
  }

  const now = Date.now();
  if (now > cache.expiresAt) {
    // Cache expired
    return null;
  }

  return cache.data;
}

/**
 * Sets WHO data in cache with 6-hour TTL
 * @param data - Internal risk data to cache
 */
export function setCachedWHOData(data: InternalRiskData[]): void {
  const now = Date.now();
  cache = {
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL,
  };
}

/**
 * Gets cached WHO data regardless of expiration
 * Used as fallback when API fails
 * @returns Cached data or null if no cache exists
 */
export function getFallbackWHOData(): InternalRiskData[] | null {
  if (!cache) {
    return null;
  }

  return cache.data;
}

/**
 * Clears the WHO data cache
 * Useful for testing and manual cache invalidation
 */
export function clearWHOCache(): void {
  cache = null;
}

/**
 * Gets cache metadata
 * @returns Cache metadata or null if no cache exists
 */
export function getCacheMetadata(): {
  timestamp: number;
  expiresAt: number;
  isExpired: boolean;
  age: number;
} | null {
  if (!cache) {
    return null;
  }

  const now = Date.now();
  return {
    timestamp: cache.timestamp,
    expiresAt: cache.expiresAt,
    isExpired: now > cache.expiresAt,
    age: now - cache.timestamp,
  };
}
