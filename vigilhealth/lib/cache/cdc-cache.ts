/**
 * CDC Data Cache
 * 
 * Implements 24-hour cache for CDC NNDSS data with fallback to cached data on API failure.
 * Uses in-memory cache for simplicity (can be replaced with Redis in production).
 */

import type { InternalRiskData } from '../external/cdc-data-mapper';

interface CacheEntry {
  data: InternalRiskData[];
  timestamp: number;
  expiresAt: number;
}

// In-memory cache (will be reset on server restart)
// In production, use Redis or similar persistent cache
let cache: CacheEntry | null = null;

// 24 hours in milliseconds
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Gets cached CDC data if available and not expired
 * @returns Cached data or null if not available or expired
 */
export function getCachedCDCData(): InternalRiskData[] | null {
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
 * Sets CDC data in cache with 24-hour TTL
 * @param data - Internal risk data to cache
 */
export function setCachedCDCData(data: InternalRiskData[]): void {
  const now = Date.now();
  cache = {
    data,
    timestamp: now,
    expiresAt: now + CACHE_TTL,
  };
}

/**
 * Gets cached CDC data regardless of expiration
 * Used as fallback when API fails
 * @returns Cached data or null if no cache exists
 */
export function getFallbackCDCData(): InternalRiskData[] | null {
  if (!cache) {
    return null;
  }

  return cache.data;
}

/**
 * Clears the CDC data cache
 * Useful for testing and manual cache invalidation
 */
export function clearCDCCache(): void {
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
