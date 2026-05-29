/**
 * Supply Finder Search API Endpoint
 *
 * Edge Function: GET /api/supply/search
 *
 * Searches supply_locations within a given radius, joins the most recent
 * supply_availability record for the requested item, sorts results by
 * distance (nearest first), and returns a SupplySearchResponse.
 *
 * Query parameters:
 *   item      - item name to search for (e.g. "N95 masks")
 *   lat       - user latitude
 *   lng       - user longitude
 *   radius    - search radius in miles (1-50, default 10)
 *   inStock   - "true" to show only in_stock locations
 *   safeBadge - "true" to show only locations with a valid safe badge
 *   premium   - "true" to show only premium locations
 */

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { calculateDistance } from '@/lib/geo/distance';
import type { SupplyAvailability, SupplyLocation } from '@/lib/supabase/types';

export const runtime = 'edge';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';

interface SupplySearchResultItem {
  id: string;
  name: string;
  type: 'pharmacy' | 'testing_site' | 'telehealth' | 'other';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  availability: AvailabilityStatus;
  lastUpdated: string;
  isPremium: boolean;
  hasSafeBadge: boolean;
  isOutdated: boolean;
  hours: string;
  contact: string;
}

interface SupplySearchResponse {
  results: SupplySearchResultItem[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a PostGIS POINT string like "POINT(-74.006 40.7128)" into {lat, lng}.
 * Returns null if parsing fails.
 */
function parsePointString(point: unknown): { lat: number; lng: number } | null {
  if (typeof point !== 'string') return null;
  const match = point.match(/POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/i);
  if (!match) return null;
  return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
}

/**
 * Parse and clamp the radius query param to [1, 50] miles. Defaults to 10.
 */
function parseRadius(raw: string | null): number {
  if (!raw) return 10;
  const n = parseFloat(raw);
  if (isNaN(n)) return 10;
  return Math.min(50, Math.max(1, n));
}

/**
 * Parse a coordinate query param. Returns null if invalid.
 */
function parseCoord(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

/**
 * Determine whether a supply availability record is older than 24 hours.
 */
function isOutdated(lastUpdated: string): boolean {
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  return Date.now() - new Date(lastUpdated).getTime() > TWENTY_FOUR_HOURS_MS;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ── Parse & validate query params ─────────────────────────────────────────
    const item = searchParams.get('item')?.trim() ?? '';
    const lat = parseCoord(searchParams.get('lat'));
    const lng = parseCoord(searchParams.get('lng'));
    const radiusMiles = parseRadius(searchParams.get('radius'));

    const filterInStock = searchParams.get('inStock') === 'true';
    const filterSafeBadge = searchParams.get('safeBadge') === 'true';
    const filterPremium = searchParams.get('premium') === 'true';

    if (lat === null || lng === null) {
      return NextResponse.json(
        { error: 'Missing required query parameters: lat and lng' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates: lat must be -90..90, lng must be -180..180' },
        { status: 400 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { error: 'Missing required query parameter: item' },
        { status: 400 }
      );
    }

    // ── Build Supabase client ──────────────────────────────────────────────────
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const userCoords = { lat, lng };

    // ── Query supply_locations ─────────────────────────────────────────────────
    // Fetch all locations (up to 500) and filter by distance in JS using the
    // Haversine formula via calculateDistance. This avoids requiring a PostGIS
    // RPC function while still implementing the radius query requirement.
    let locationsQuery = supabase
      .from('supply_locations')
      .select('*')
      .limit(500);

    if (filterPremium) {
      locationsQuery = locationsQuery.eq('is_premium', true);
    }

    if (filterSafeBadge) {
      locationsQuery = locationsQuery.eq('has_safe_badge', true);
    }

    const { data: locationRows, error: locationError } = await locationsQuery;

    if (locationError) {
      console.error('[Supply Search] supply_locations query error:', locationError);
      return NextResponse.json(
        { error: 'Failed to query supply locations' },
        { status: 500 }
      );
    }

    // Filter by radius using Haversine great-circle distance
    const nearbyLocations: (SupplyLocation & { distanceMiles: number })[] = [];
    for (const row of locationRows ?? []) {
      const coords = parsePointString(row.location as unknown);
      if (!coords) continue;
      const dist = calculateDistance(userCoords, coords, 'miles');
      if (dist <= radiusMiles) {
        nearbyLocations.push({ ...(row as SupplyLocation), distanceMiles: dist });
      }
    }

    if (nearbyLocations.length === 0) {
      const response: SupplySearchResponse = { results: [], total: 0 };
      return NextResponse.json(response);
    }

    // ── Query supply_availability for the requested item ───────────────────────
    // Fetch the most recent availability record per location for the given item.
    const locationIds = nearbyLocations.map((l) => l.id);

    const { data: availabilityRows, error: availabilityError } = await supabase
      .from('supply_availability')
      .select('*')
      .in('location_id', locationIds)
      .ilike('item_name', `%${item}%`)
      .order('created_at', { ascending: false })
      .limit(locationIds.length * 5); // at most 5 records per location

    if (availabilityError) {
      console.error('[Supply Search] supply_availability query error:', availabilityError);
      // Non-fatal: continue with unknown availability
    }

    // Build a map of location_id → most recent availability record
    const availabilityMap = new Map<string, SupplyAvailability>();
    for (const row of availabilityRows ?? []) {
      const avail = row as SupplyAvailability;
      if (!avail.location_id) continue;
      // Since rows are ordered by created_at desc, the first entry per location wins
      if (!availabilityMap.has(avail.location_id)) {
        availabilityMap.set(avail.location_id, avail);
      }
    }

    // ── Build result items ─────────────────────────────────────────────────────
    const now = new Date().toISOString();

    let results: SupplySearchResultItem[] = nearbyLocations.map((loc) => {
      const avail = availabilityMap.get(loc.id);
      const availability: AvailabilityStatus = avail?.status ?? 'unknown';
      const lastUpdated = avail?.created_at ?? loc.updated_at ?? now;
      const outdated = isOutdated(lastUpdated);

      const coords = parsePointString(loc.location as unknown) ?? { lat: 0, lng: 0 };

      return {
        id: loc.id,
        name: loc.name,
        type: loc.type ?? 'other',
        location: {
          lat: coords.lat,
          lng: coords.lng,
          address: loc.address,
        },
        distance: Math.round(loc.distanceMiles * 10) / 10,
        availability,
        lastUpdated,
        isPremium: loc.is_premium,
        hasSafeBadge: loc.has_safe_badge,
        isOutdated: outdated,
        hours: loc.hours ?? '',
        contact: loc.phone ?? '',
      };
    });

    // ── Apply in-stock filter ──────────────────────────────────────────────────
    if (filterInStock) {
      results = results.filter((r) => r.availability === 'in_stock');
    }

    // ── Sort: premium first, then by distance (nearest first) ─────────────────
    // Premium listings appear at the top per the revenue feature spec (task 24.3).
    // Within each tier, sort by distance ascending.
    results.sort((a, b) => {
      if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
      return a.distance - b.distance;
    });

    const response: SupplySearchResponse = {
      results,
      total: results.length,
    };

    return NextResponse.json(response, {
      headers: {
        // Short cache: supply availability changes frequently
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[Supply Search] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Unexpected error processing supply search request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
