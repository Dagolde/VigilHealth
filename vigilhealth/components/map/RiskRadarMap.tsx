'use client';

/**
 * RiskRadarMap component
 *
 * Interactive Mapbox GL map with color-coded risk level overlays.
 *
 * Features:
 * - Lazy loading via IntersectionObserver (conserves 50K free tier)
 * - Zoom levels 10-15 (city to neighborhood)
 * - Color-coded risk overlays (low/moderate/high/critical)
 * - Click handlers for location details
 * - Offline: cached map tiles via service worker
 * - Usage tracking with 40K load alert
 */

import type mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';

import { trackMapboxLoad } from '@/lib/mapbox/usage-tracker';

import { RISK_LEVEL_COLORS, RiskLegend } from './RiskLegend';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiskPoint {
  lat: number;
  lng: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  disease?: string;
  caseCount?: number;
  locationName?: string;
}

export interface ReportCountPoint {
  lat: number;
  lng: number;
  count: number;
  recentCount: number;
}

export interface RiskRadarMapProps {
  /** [lng, lat] — defaults to US geographic center */
  center?: [number, number];
  /** Zoom level 10-15, default 12 */
  zoom?: number;
  /** Risk data points to render as overlays */
  riskData?: RiskPoint[];
  /** Community report count points to render as a separate layer */
  reportCounts?: ReportCountPoint[];
  /** CSS height string, default '400px' */
  height?: string;
  className?: string;
  onLocationClick?: (lat: number, lng: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const US_CENTER: [number, number] = [-98.5795, 39.8283]; // [lng, lat]
const MIN_ZOOM = 10;
const MAX_ZOOM = 15;
const DEFAULT_ZOOM = 12;
const RISK_SOURCE_ID = 'risk-data';
const RISK_LAYER_ID = 'risk-circles';
const REPORT_COUNT_SOURCE_ID = 'report-counts';
const REPORT_COUNT_LAYER_ID = 'report-counts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts an array of RiskPoints to a GeoJSON FeatureCollection.
 */
function riskPointsToGeoJSON(
  points: RiskPoint[]
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat],
      },
      properties: {
        riskLevel: point.riskLevel,
        disease: point.disease ?? null,
        caseCount: point.caseCount ?? null,
        locationName: point.locationName ?? null,
      },
    })),
  };
}

/**
 * Converts an array of ReportCountPoints to a GeoJSON FeatureCollection.
 */
function reportCountsToGeoJSON(
  points: ReportCountPoint[]
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.lng, point.lat],
      },
      properties: {
        count: point.count,
        recentCount: point.recentCount,
      },
    })),
  };
}

/**
 * Clamps a zoom value to the allowed range [MIN_ZOOM, MAX_ZOOM].
 */
function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RiskRadarMap({
  center = US_CENTER,
  zoom = DEFAULT_ZOOM,
  riskData = [],
  reportCounts = [],
  height = '400px',
  className = '',
  onLocationClick,
}: RiskRadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usageWarning, setUsageWarning] = useState(false);

  // ── Lazy loading via IntersectionObserver ──────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ── Initialize Mapbox when visible ────────────────────────────────────────
  useEffect(() => {
    if (!isVisible || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setLoadError('Mapbox token is not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN.');
      return;
    }

    let map: mapboxgl.Map;

    // Dynamically import mapbox-gl to avoid SSR issues
    import('mapbox-gl').then((mapboxModule) => {
      const mapboxgl = mapboxModule.default;

      // Track this map load and check usage
      const stats = trackMapboxLoad();
      if (stats.isNearLimit) {
        setUsageWarning(true);
      }

      mapboxgl.accessToken = token;

      map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center,
        zoom: clampZoom(zoom),
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        attributionControl: true,
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        mapRef.current = map;
        setIsLoaded(true);
        addRiskOverlay(map, riskData);
        addReportCountOverlay(map, reportCounts);
      });

      map.on('error', (e) => {
        console.error('[RiskRadarMap] Mapbox error:', e);
        setLoadError('Failed to load map. Please check your connection.');
      });

      // Click handler
      if (onLocationClick) {
        map.on('click', (e) => {
          onLocationClick(e.lngLat.lat, e.lngLat.lng);
        });
      }

      // Click on risk circles
      map.on('click', RISK_LAYER_ID, (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const props = feature.properties;
        if (!props) return;

        const coords = (feature.geometry as GeoJSON.Point).coordinates;
        new mapboxgl.Popup({ offset: 12 })
          .setLngLat([coords[0], coords[1]])
          .setHTML(buildPopupHTML(props))
          .addTo(map);

        // Prevent map click from firing
        e.preventDefault?.();
      });

      // Pointer cursor on hover
      map.on('mouseenter', RISK_LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', RISK_LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
      });
    }).catch((err) => {
      console.error('[RiskRadarMap] Failed to load mapbox-gl:', err);
      setLoadError('Failed to initialize map library.');
    });

    return () => {
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // ── Update risk overlay when riskData changes ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    updateRiskOverlay(map, riskData);
  }, [riskData, isLoaded]);

  // ── Update report count overlay when reportCounts changes ─────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    updateReportCountOverlay(map, reportCounts);
  }, [reportCounts, isLoaded]);

  // ── Update center/zoom when props change ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    map.flyTo({ center, zoom: clampZoom(zoom), duration: 800 });
  }, [center, zoom, isLoaded]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Usage warning banner */}
      {usageWarning && (
        <div
          role="alert"
          className="absolute top-0 left-0 right-0 z-10 bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-800 text-center"
        >
          Map usage is near the monthly limit. Some features may be restricted.
        </div>
      )}

      {/* Map container — always rendered so IntersectionObserver can observe it */}
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        aria-label="Risk Radar map"
        role="application"
      />

      {/* Loading placeholder */}
      {!isLoaded && !loadError && (
        <div
          aria-live="polite"
          aria-label="Loading map"
          className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg"
        >
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <div
              className="w-8 h-8 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin"
              aria-hidden="true"
            />
            <span className="text-sm">Loading map…</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg p-4"
        >
          <p className="text-sm text-red-600 text-center">{loadError}</p>
        </div>
      )}

      {/* Legend — shown once map is loaded */}
      {isLoaded && (
        <div className="absolute bottom-6 left-3 z-10">
          <RiskLegend />
        </div>
      )}
    </div>
  );
}

// ─── Map layer helpers ────────────────────────────────────────────────────────

/**
 * Adds the risk data source and circle layer to the map.
 */
function addRiskOverlay(map: mapboxgl.Map, riskData: RiskPoint[]): void {
  const geojson = riskPointsToGeoJSON(riskData);

  if (map.getSource(RISK_SOURCE_ID)) {
    (map.getSource(RISK_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    return;
  }

  map.addSource(RISK_SOURCE_ID, {
    type: 'geojson',
    data: geojson,
  });

  map.addLayer({
    id: RISK_LAYER_ID,
    type: 'circle',
    source: RISK_SOURCE_ID,
    paint: {
      'circle-color': [
        'match',
        ['get', 'riskLevel'],
        'low', RISK_LEVEL_COLORS.low,
        'moderate', RISK_LEVEL_COLORS.moderate,
        'high', RISK_LEVEL_COLORS.high,
        'critical', RISK_LEVEL_COLORS.critical,
        '#6b7280', // fallback gray
      ],
      'circle-radius': 10,
      'circle-opacity': 0.7,
      'circle-stroke-width': 1,
      'circle-stroke-color': 'rgba(255,255,255,0.6)',
    },
  });
}

/**
 * Adds the report count data source and circle layer to the map.
 * Renders as small gray circles, distinct from risk level circles.
 */
function addReportCountOverlay(map: mapboxgl.Map, reportCounts: ReportCountPoint[]): void {
  const geojson = reportCountsToGeoJSON(reportCounts);

  if (map.getSource(REPORT_COUNT_SOURCE_ID)) {
    (map.getSource(REPORT_COUNT_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    return;
  }

  map.addSource(REPORT_COUNT_SOURCE_ID, {
    type: 'geojson',
    data: geojson,
  });

  map.addLayer({
    id: REPORT_COUNT_LAYER_ID,
    type: 'circle',
    source: REPORT_COUNT_SOURCE_ID,
    paint: {
      'circle-color': '#9ca3af', // gray-400
      'circle-radius': 6,
      'circle-opacity': 0.5,
      'circle-stroke-width': 1,
      'circle-stroke-color': 'rgba(255,255,255,0.8)',
    },
  });
}

/**
 * Updates the report count data source with new data.
 */
function updateReportCountOverlay(map: mapboxgl.Map, reportCounts: ReportCountPoint[]): void {
  const source = map.getSource(REPORT_COUNT_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (source) {
    source.setData(reportCountsToGeoJSON(reportCounts));
  } else {
    addReportCountOverlay(map, reportCounts);
  }
}

/**
 */
function updateRiskOverlay(map: mapboxgl.Map, riskData: RiskPoint[]): void {
  const source = map.getSource(RISK_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (source) {
    source.setData(riskPointsToGeoJSON(riskData));
  } else {
    addRiskOverlay(map, riskData);
  }
}

/**
 * Builds the HTML string for a risk point popup.
 */
function buildPopupHTML(props: Record<string, unknown>): string {
  const riskLevel = String(props.riskLevel ?? 'unknown');
  const disease = props.disease ? `<p class="text-xs text-gray-600">${escapeHtml(String(props.disease))}</p>` : '';
  const caseCount = props.caseCount !== null && props.caseCount !== undefined
    ? `<p class="text-xs text-gray-500">${Number(props.caseCount).toLocaleString()} cases</p>`
    : '';
  const locationName = props.locationName
    ? `<p class="text-sm font-medium text-gray-800">${escapeHtml(String(props.locationName))}</p>`
    : '';

  const colorMap: Record<string, string> = {
    low: '#10b981',
    moderate: '#f59e0b',
    high: '#ef4444',
    critical: '#7f1d1d',
  };
  const color = colorMap[riskLevel] ?? '#6b7280';

  return `
    <div style="min-width:140px;font-family:sans-serif;">
      ${locationName}
      <span style="display:inline-flex;align-items:center;gap:4px;margin-top:2px;">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;"></span>
        <span style="font-size:12px;font-weight:600;text-transform:capitalize;">${escapeHtml(riskLevel)} risk</span>
      </span>
      ${disease}
      ${caseCount}
    </div>
  `.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
