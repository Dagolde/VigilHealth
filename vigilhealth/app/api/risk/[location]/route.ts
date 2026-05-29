/**
 * Risk Radar API Endpoint
 *
 * Edge Function: GET /api/risk/[location]
 *
 * Returns risk data for a given location (lat,lng or place name).
 * Queries the risk_levels and community_reports tables, aggregates
 * data with source priority (CDC > WHO > community), and returns
 * a RiskResponse with a 6-hour edge cache.
 */

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { Coordinates } from '@/lib/geo/distance';
import { calculateDistance } from '@/lib/geo/distance';
import {
  applyCommunitySupplement,
  calculateRiskScore,
  resolveRiskByPriority,
  type RiskDataPoint,
  type RiskLevelValue,
  type RiskSourceEntry,
} from '@/lib/risk/risk-aggregation';
import type { CommunityReport, RiskLevel } from '@/lib/supabase/types';

export const runtime = 'edge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RiskResponse {
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  riskLevel: RiskLevelValue;
  riskScore: number;
  sources: Array<{
    type: 'who' | 'cdc' | 'community';
    timestamp: string;
    confidence: number;
  }>;
  nearbyOutbreaks: Array<{
    disease: string;
    distance: number;
    caseCount: number;
  }>;
  lastUpdated: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse a lat,lng string like "40.7128,-74.0060".
 * Returns null if the string doesn't match the pattern.
 */
function parseLatLng(input: string): Coordinates | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

/**
 * Parse the radius query param. Clamps to [1, 50] miles, defaults to 5.
 */
function parseRadius(raw: string | null): number {
  if (!raw) return 5;
  const n = parseFloat(raw);
  if (isNaN(n)) return 5;
  return Math.min(50, Math.max(1, n));
}

/**
 * Extract lat/lng from a PostGIS POINT string stored as text, e.g. "POINT(-74.006 40.7128)".
 * Returns null if parsing fails.
 */
function parsePointString(point: unknown): Coordinates | null {
  if (typeof point !== 'string') return null;
  const match = point.match(/POINT\((-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\)/i);
  if (!match) return null;
  return { lat: parseFloat(match[2]), lng: parseFloat(match[1]) };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { location: string } }
) {
  try {
    const rawLocation = decodeURIComponent(params.location);
    const { searchParams } = new URL(request.url);
    const radiusMiles = parseRadius(searchParams.get('radius'));

    // Parse location — only lat,lng supported; place names return 400
    const coords = parseLatLng(rawLocation);
    if (!coords) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid location format. Use "lat,lng" (e.g. "40.7128,-74.0060"). Place name geocoding is not yet supported.',
        },
        { status: 400 }
      );
    }

    // Build anon-key Supabase client (safe for Edge Runtime)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ── Query risk_levels ──────────────────────────────────────────────────────
    // Fetch recent, valid risk levels and filter by distance in JS (Haversine).
    // We fetch up to 200 records ordered by confidence desc, valid_from desc.
    const { data: riskRows, error: riskError } = await supabase
      .from('risk_levels')
      .select('*')
      .or('valid_until.is.null,valid_until.gt.' + now.toISOString())
      .order('confidence', { ascending: false })
      .order('valid_from', { ascending: false })
      .limit(200);

    if (riskError) {
      console.error('[Risk API] risk_levels query error:', riskError);
    }

    // Filter by distance
    const nearbyRiskLevels: (RiskLevel & { distanceMiles: number })[] = [];
    for (const row of riskRows ?? []) {
      const rowCoords = parsePointString(row.location as unknown);
      if (!rowCoords) continue;
      const dist = calculateDistance(coords, rowCoords, 'miles');
      if (dist <= radiusMiles) {
        nearbyRiskLevels.push({ ...(row as RiskLevel), distanceMiles: dist });
      }
    }

    // ── Query community_reports ────────────────────────────────────────────────
    const { data: reportRows, error: reportError } = await supabase
      .from('community_reports')
      .select('*')
      .eq('is_flagged', false)
      .gte('created_at', sevenDaysAgo.toISOString())
      .limit(500);

    if (reportError) {
      console.error('[Risk API] community_reports query error:', reportError);
    }

    // Filter community reports by distance
    const nearbyReports: (CommunityReport & { distanceMiles: number })[] = [];
    for (const row of reportRows ?? []) {
      const rowCoords = parsePointString(row.location as unknown);
      if (!rowCoords) continue;
      const dist = calculateDistance(coords, rowCoords, 'miles');
      if (dist <= radiusMiles) {
        nearbyReports.push({ ...(row as CommunityReport), distanceMiles: dist });
      }
    }

    // ── Aggregate risk ─────────────────────────────────────────────────────────

    // Build source entries for priority resolution
    const sourceEntries: RiskSourceEntry[] = nearbyRiskLevels
      .filter((r) => r.risk_level && r.source)
      .map((r) => ({
        source: r.source as 'who' | 'cdc' | 'community',
        riskLevel: r.risk_level as RiskLevelValue,
        confidence: r.confidence ?? 50,
        timestamp: r.valid_from,
      }));

    // Resolve official risk (CDC > WHO > community from risk_levels table)
    const officialRisk = resolveRiskByPriority(sourceEntries);

    // Community supplement: count nearby reports
    const recentReportCount = nearbyReports.filter(
      (r) => new Date(r.created_at) >= sevenDaysAgo
    ).length;
    const totalReportCount = nearbyReports.length;

    // Apply community supplement only if no official data
    const hasOfficialData = sourceEntries.some(
      (e) => e.source === 'cdc' || e.source === 'who'
    );
    const finalRiskLevel = hasOfficialData
      ? officialRisk
      : applyCommunitySupplement(officialRisk, totalReportCount, recentReportCount);

    // Calculate composite risk score
    const dataPoints: RiskDataPoint[] = [
      ...nearbyRiskLevels
        .filter((r) => r.risk_level)
        .map((r) => ({
          riskLevel: r.risk_level as RiskLevelValue,
          confidence: r.confidence ?? 50,
          weight:
            r.source === 'cdc' ? 1.5 : r.source === 'who' ? 1.2 : 0.8,
        })),
      // Community reports contribute with lower weight
      ...nearbyReports.map((r) => ({
        riskLevel: 'low' as RiskLevelValue, // reports don't carry a risk level directly
        confidence: 40,
        weight: new Date(r.created_at) >= sevenDaysAgo ? 1.0 : 0.5,
      })),
    ];

    const riskScore = calculateRiskScore(dataPoints);

    // ── Build response ─────────────────────────────────────────────────────────

    // Deduplicate sources (one entry per source type, most recent timestamp)
    const sourceMap = new Map<string, { type: 'who' | 'cdc' | 'community'; timestamp: string; confidence: number }>();
    for (const entry of sourceEntries) {
      const existing = sourceMap.get(entry.source);
      if (!existing || entry.timestamp > existing.timestamp) {
        sourceMap.set(entry.source, {
          type: entry.source,
          timestamp: entry.timestamp,
          confidence: entry.confidence,
        });
      }
    }
    // Add community source if there are nearby reports
    if (nearbyReports.length > 0) {
      const latestReport = nearbyReports.reduce((a, b) =>
        a.created_at > b.created_at ? a : b
      );
      sourceMap.set('community', {
        type: 'community',
        timestamp: latestReport.created_at,
        confidence: 60,
      });
    }

    // Build nearby outbreaks list (unique diseases, sorted by distance)
    const outbreakMap = new Map<
      string,
      { disease: string; distance: number; caseCount: number }
    >();
    for (const r of nearbyRiskLevels) {
      const key = r.disease;
      const existing = outbreakMap.get(key);
      if (!existing || r.distanceMiles < existing.distance) {
        outbreakMap.set(key, {
          disease: r.disease,
          distance: Math.round(r.distanceMiles * 10) / 10,
          caseCount: r.case_count ?? 0,
        });
      }
    }
    const nearbyOutbreaks = Array.from(outbreakMap.values()).sort(
      (a, b) => a.distance - b.distance
    );

    const lastUpdated =
      nearbyRiskLevels.length > 0
        ? nearbyRiskLevels[0].updated_at
        : now.toISOString();

    const response: RiskResponse = {
      location: {
        lat: coords.lat,
        lng: coords.lng,
        name: `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`,
      },
      riskLevel: finalRiskLevel,
      riskScore,
      sources: Array.from(sourceMap.values()),
      nearbyOutbreaks,
      lastUpdated,
    };

    // 6-hour edge cache (s-maxage=21600), 1-hour stale-while-revalidate
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('[Risk API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error processing risk request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
