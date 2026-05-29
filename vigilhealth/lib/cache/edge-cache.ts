/**
 * Edge Cache Utility
 *
 * Provides helpers for setting cache headers on API responses.
 * Used by risk and supply API routes for edge caching.
 */

import type { NextResponse } from 'next/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CacheOptions {
  /** Max age in seconds for CDN/edge cache */
  sMaxAge: number;
  /** Stale-while-revalidate window in seconds */
  staleWhileRevalidate?: number;
  /** Whether to allow browser caching */
  public?: boolean;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

export const CACHE_PRESETS = {
  /** Risk data: 6-hour edge cache */
  riskData: { sMaxAge: 6 * 60 * 60, staleWhileRevalidate: 60 * 60, public: true },
  /** Supply data: 5-minute edge cache */
  supplyData: { sMaxAge: 5 * 60, staleWhileRevalidate: 60, public: true },
  /** Static content: 24-hour edge cache */
  staticContent: { sMaxAge: 24 * 60 * 60, staleWhileRevalidate: 60 * 60, public: true },
  /** No cache (private/user-specific data) */
  noCache: { sMaxAge: 0, public: false },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Cache-Control header value from options.
 */
export function buildCacheControlHeader(options: CacheOptions): string {
  const parts: string[] = [];

  if (options.public) {
    parts.push('public');
  } else {
    parts.push('private');
  }

  parts.push(`s-maxage=${options.sMaxAge}`);

  if (options.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  return parts.join(', ');
}

/**
 * Apply cache headers to a NextResponse.
 */
export function applyCacheHeaders(
  response: NextResponse,
  preset: keyof typeof CACHE_PRESETS | CacheOptions
): NextResponse {
  const options = typeof preset === 'string' ? CACHE_PRESETS[preset] : preset;
  response.headers.set('Cache-Control', buildCacheControlHeader(options));
  return response;
}

/**
 * Create cache headers object for use with NextResponse.json().
 */
export function getCacheHeaders(
  preset: keyof typeof CACHE_PRESETS | CacheOptions
): Record<string, string> {
  const options = typeof preset === 'string' ? CACHE_PRESETS[preset] : preset;
  return {
    'Cache-Control': buildCacheControlHeader(options),
  };
}
