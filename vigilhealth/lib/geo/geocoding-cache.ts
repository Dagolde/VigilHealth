/**
 * Geocoding result cache with 24-hour TTL
 * 
 * Caches geocoding results to minimize API calls to Mapbox.
 * Uses in-memory cache with automatic expiration.
 */

import type { GeocodingResult } from './mapbox-geocoding';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generic cache implementation with TTL
 */
class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  /**
   * Get a value from the cache
   * 
   * @param key - Cache key
   * @returns Cached value or null if not found or expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in the cache
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Time to live in milliseconds (default: 24 hours)
   */
  set(key: string, value: T, ttlMs: number = CACHE_TTL_MS): void {
    const now = Date.now();
    this.cache.set(key, {
      data: value,
      timestamp: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Check if a key exists and is not expired
   * 
   * @param key - Cache key
   * @returns true if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a key from the cache
   * 
   * @param key - Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from the cache
   * 
   * @returns Number of entries removed
   */
  prune(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get cache statistics
   * 
   * @returns Object with cache size and expired count
   */
  stats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      expired,
    };
  }
}

// Global cache instances
const forwardGeocodingCache = new TTLCache<GeocodingResult[]>();
const reverseGeocodingCache = new TTLCache<GeocodingResult[]>();

/**
 * Generate a cache key for forward geocoding
 * 
 * @param query - Search query
 * @param options - Geocoding options
 * @returns Cache key string
 */
function generateForwardCacheKey(
  query: string,
  options: {
    country?: string;
    types?: string[];
    limit?: number;
  } = {}
): string {
  const parts = [
    'forward',
    query.toLowerCase().trim(),
    options.country || '',
    (options.types || []).sort().join(','),
    (options.limit || 5).toString(),
  ];

  return parts.join('|');
}

/**
 * Generate a cache key for reverse geocoding
 * 
 * @param lng - Longitude
 * @param lat - Latitude
 * @param options - Reverse geocoding options
 * @returns Cache key string
 */
function generateReverseCacheKey(
  lng: number,
  lat: number,
  options: {
    types?: string[];
    limit?: number;
  } = {}
): string {
  // Round coordinates to 4 decimal places (~11m precision)
  const roundedLng = lng.toFixed(4);
  const roundedLat = lat.toFixed(4);

  const parts = [
    'reverse',
    roundedLng,
    roundedLat,
    (options.types || []).sort().join(','),
    (options.limit || 1).toString(),
  ];

  return parts.join('|');
}

/**
 * Get cached forward geocoding results
 * 
 * @param query - Search query
 * @param options - Geocoding options
 * @returns Cached results or null if not found
 */
export function getCachedForwardGeocoding(
  query: string,
  options: {
    country?: string;
    types?: string[];
    limit?: number;
  } = {}
): GeocodingResult[] | null {
  const key = generateForwardCacheKey(query, options);
  return forwardGeocodingCache.get(key);
}

/**
 * Cache forward geocoding results
 * 
 * @param query - Search query
 * @param options - Geocoding options
 * @param results - Geocoding results to cache
 */
export function cacheForwardGeocoding(
  query: string,
  options: {
    country?: string;
    types?: string[];
    limit?: number;
  } = {},
  results: GeocodingResult[]
): void {
  const key = generateForwardCacheKey(query, options);
  forwardGeocodingCache.set(key, results);
}

/**
 * Get cached reverse geocoding results
 * 
 * @param lng - Longitude
 * @param lat - Latitude
 * @param options - Reverse geocoding options
 * @returns Cached results or null if not found
 */
export function getCachedReverseGeocoding(
  lng: number,
  lat: number,
  options: {
    types?: string[];
    limit?: number;
  } = {}
): GeocodingResult[] | null {
  const key = generateReverseCacheKey(lng, lat, options);
  return reverseGeocodingCache.get(key);
}

/**
 * Cache reverse geocoding results
 * 
 * @param lng - Longitude
 * @param lat - Latitude
 * @param options - Reverse geocoding options
 * @param results - Geocoding results to cache
 */
export function cacheReverseGeocoding(
  lng: number,
  lat: number,
  options: {
    types?: string[];
    limit?: number;
  } = {},
  results: GeocodingResult[]
): void {
  const key = generateReverseCacheKey(lng, lat, options);
  reverseGeocodingCache.set(key, results);
}

/**
 * Clear all geocoding caches
 */
export function clearGeocodingCache(): void {
  forwardGeocodingCache.clear();
  reverseGeocodingCache.clear();
}

/**
 * Prune expired entries from all caches
 * 
 * @returns Total number of entries removed
 */
export function pruneGeocodingCache(): number {
  return forwardGeocodingCache.prune() + reverseGeocodingCache.prune();
}

/**
 * Get cache statistics
 * 
 * @returns Object with statistics for both caches
 */
export function getGeocodingCacheStats(): {
  forward: { size: number; expired: number };
  reverse: { size: number; expired: number };
} {
  return {
    forward: forwardGeocodingCache.stats(),
    reverse: reverseGeocodingCache.stats(),
  };
}
