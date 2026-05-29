/**
 * Tests for RiskRadarMap, RiskLegend, and Mapbox usage tracker.
 *
 * mapbox-gl is mocked because it requires a browser canvas environment
 * that is not available in jsdom.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock mapbox-gl ───────────────────────────────────────────────────────────
vi.mock('mapbox-gl', () => {
  const NavigationControl = vi.fn();
  const Popup = vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setHTML: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
  }));

  const Map = vi.fn(() => ({
    addControl: vi.fn(),
    on: vi.fn(),
    remove: vi.fn(),
    getSource: vi.fn(() => null),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    flyTo: vi.fn(),
    getCanvas: vi.fn(() => ({ style: { cursor: '' } })),
  }));

  return {
    default: {
      Map,
      NavigationControl,
      Popup,
      accessToken: '',
    },
  };
});

// ─── Mock IntersectionObserver ────────────────────────────────────────────────
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    // Immediately trigger as visible
    setTimeout(() => {
      callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    }, 0);
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// ─── Imports ──────────────────────────────────────────────────────────────────

import {
  getMapboxUsageStats,
  resetMapboxUsageStats,
  trackMapboxLoad,
} from '@/lib/mapbox/usage-tracker';

import { RISK_LEVEL_COLORS, RISK_LEVELS, RiskLegend } from '../RiskLegend';

// ─── RiskLegend tests ─────────────────────────────────────────────────────────

describe('RiskLegend', () => {
  it('renders all 4 risk levels', () => {
    render(<RiskLegend />);

    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders correct color for low risk level', () => {
    render(<RiskLegend />);

    const lowDot = document.querySelector('[data-risk-level="low"]');
    expect(lowDot).not.toBeNull();
    expect(lowDot?.getAttribute('data-risk-color')).toBe('#10b981');
  });

  it('renders correct color for moderate risk level', () => {
    render(<RiskLegend />);

    const moderateDot = document.querySelector('[data-risk-level="moderate"]');
    expect(moderateDot).not.toBeNull();
    expect(moderateDot?.getAttribute('data-risk-color')).toBe('#f59e0b');
  });

  it('renders correct color for high risk level', () => {
    render(<RiskLegend />);

    const highDot = document.querySelector('[data-risk-level="high"]');
    expect(highDot).not.toBeNull();
    expect(highDot?.getAttribute('data-risk-color')).toBe('#ef4444');
  });

  it('renders correct color for critical risk level', () => {
    render(<RiskLegend />);

    const criticalDot = document.querySelector('[data-risk-level="critical"]');
    expect(criticalDot).not.toBeNull();
    expect(criticalDot?.getAttribute('data-risk-color')).toBe('#7f1d1d');
  });

  it('has accessible role and label', () => {
    render(<RiskLegend />);

    const legend = screen.getByRole('complementary', { name: /risk level legend/i });
    expect(legend).toBeInTheDocument();
  });
});

// ─── RISK_LEVEL_COLORS mapping tests ─────────────────────────────────────────

describe('RiskPoint color mapping', () => {
  it('maps low to green (#10b981)', () => {
    expect(RISK_LEVEL_COLORS.low).toBe('#10b981');
  });

  it('maps moderate to amber (#f59e0b)', () => {
    expect(RISK_LEVEL_COLORS.moderate).toBe('#f59e0b');
  });

  it('maps high to red (#ef4444)', () => {
    expect(RISK_LEVEL_COLORS.high).toBe('#ef4444');
  });

  it('maps critical to dark red (#7f1d1d)', () => {
    expect(RISK_LEVEL_COLORS.critical).toBe('#7f1d1d');
  });

  it('RISK_LEVELS array contains all 4 levels in order', () => {
    const levels = RISK_LEVELS.map((r) => r.level);
    expect(levels).toEqual(['low', 'moderate', 'high', 'critical']);
  });
});

// ─── Usage tracker tests ──────────────────────────────────────────────────────

describe('Mapbox usage tracker', () => {
  beforeEach(() => {
    resetMapboxUsageStats();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    resetMapboxUsageStats();
    vi.restoreAllMocks();
  });

  it('getMapboxUsageStats returns count 0 when no loads tracked', () => {
    const stats = getMapboxUsageStats();
    expect(stats.count).toBe(0);
  });

  it('trackMapboxLoad increments count by 1', () => {
    trackMapboxLoad();
    const stats = getMapboxUsageStats();
    expect(stats.count).toBe(1);
  });

  it('trackMapboxLoad increments count correctly across multiple calls', () => {
    trackMapboxLoad();
    trackMapboxLoad();
    trackMapboxLoad();
    const stats = getMapboxUsageStats();
    expect(stats.count).toBe(3);
  });

  it('getMapboxUsageStats returns correct percentUsed', () => {
    // Manually set count to 25000 (50% of 50K)
    localStorage.setItem('mapbox_load_count', '25000');
    localStorage.setItem('mapbox_load_date', new Date().toISOString().slice(0, 10));

    const stats = getMapboxUsageStats();
    expect(stats.percentUsed).toBe(50);
  });

  it('usage tracker resets count when date changes', () => {
    // Simulate yesterday's data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    localStorage.setItem('mapbox_load_count', '1000');
    localStorage.setItem('mapbox_load_date', yesterdayStr);

    const stats = getMapboxUsageStats();
    expect(stats.count).toBe(0);
  });

  it('trackMapboxLoad resets and starts from 1 when date changes', () => {
    // Simulate yesterday's data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    localStorage.setItem('mapbox_load_count', '5000');
    localStorage.setItem('mapbox_load_date', yesterdayStr);

    const stats = trackMapboxLoad();
    expect(stats.count).toBe(1);
  });

  it('usage tracker alerts (console.warn) when count reaches 40000', () => {
    // Set count to 39999 so next load triggers the alert
    localStorage.setItem('mapbox_load_count', '39999');
    localStorage.setItem('mapbox_load_date', new Date().toISOString().slice(0, 10));

    trackMapboxLoad();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('40,000')
    );
  });

  it('isNearLimit is false below 40K', () => {
    localStorage.setItem('mapbox_load_count', '39999');
    localStorage.setItem('mapbox_load_date', new Date().toISOString().slice(0, 10));

    const stats = getMapboxUsageStats();
    expect(stats.isNearLimit).toBe(false);
  });

  it('isNearLimit is true at exactly 40K', () => {
    localStorage.setItem('mapbox_load_count', '40000');
    localStorage.setItem('mapbox_load_date', new Date().toISOString().slice(0, 10));

    const stats = getMapboxUsageStats();
    expect(stats.isNearLimit).toBe(true);
  });

  it('isNearLimit is true above 40K', () => {
    localStorage.setItem('mapbox_load_count', '45000');
    localStorage.setItem('mapbox_load_date', new Date().toISOString().slice(0, 10));

    const stats = getMapboxUsageStats();
    expect(stats.isNearLimit).toBe(true);
  });

  it('console.warn is NOT called below 40K threshold', () => {
    localStorage.setItem('mapbox_load_count', '100');
    localStorage.setItem('mapbox_load_date', new Date().toISOString().slice(0, 10));

    trackMapboxLoad();

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('resetMapboxUsageStats clears stored data', () => {
    trackMapboxLoad();
    trackMapboxLoad();
    resetMapboxUsageStats();

    const stats = getMapboxUsageStats();
    expect(stats.count).toBe(0);
  });
});
