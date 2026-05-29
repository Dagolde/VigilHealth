/**
 * Unit tests for report-weights.ts
 */

import { describe, expect, it } from 'vitest';

import {
  aggregateReportScore,
  computeReportWeight,
  getReportCountSummary,
  type WeightedReport,
} from '../report-weights';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ─── computeReportWeight ──────────────────────────────────────────────────────

describe('computeReportWeight', () => {
  it('recent report (< 7 days) has base weight 1.0 before distance decay', () => {
    const weight = computeReportWeight({
      createdAt: daysAgo(1),
      observationType: 'supply',
      distanceMiles: 0,
    });
    // distanceMiles=0 → decay = 1/(1+0) = 1.0; supply → multiplier 1.0
    expect(weight).toBeCloseTo(1.0, 5);
  });

  it('old report (> 30 days) has lower weight than a recent report', () => {
    const recentWeight = computeReportWeight({
      createdAt: daysAgo(1),
      observationType: 'supply',
      distanceMiles: 0,
    });
    const oldWeight = computeReportWeight({
      createdAt: daysAgo(45),
      observationType: 'supply',
      distanceMiles: 0,
    });
    expect(oldWeight).toBeLessThan(recentWeight);
  });

  it('old report (> 30 days) has base weight 0.1 at zero distance', () => {
    const weight = computeReportWeight({
      createdAt: daysAgo(45),
      observationType: 'supply',
      distanceMiles: 0,
    });
    expect(weight).toBeCloseTo(0.1, 5);
  });

  it('mid-age report (7-30 days) has base weight 0.5 at zero distance', () => {
    const weight = computeReportWeight({
      createdAt: daysAgo(15),
      observationType: 'supply',
      distanceMiles: 0,
    });
    expect(weight).toBeCloseTo(0.5, 5);
  });

  it('symptom reports have higher weight than supply reports', () => {
    const symptomWeight = computeReportWeight({
      createdAt: daysAgo(1),
      observationType: 'symptom',
      distanceMiles: 0,
    });
    const supplyWeight = computeReportWeight({
      createdAt: daysAgo(1),
      observationType: 'supply',
      distanceMiles: 0,
    });
    expect(symptomWeight).toBeGreaterThan(supplyWeight);
  });

  it('symptom report has weight 1.2 at zero distance (recent)', () => {
    const weight = computeReportWeight({
      createdAt: daysAgo(1),
      observationType: 'symptom',
      distanceMiles: 0,
    });
    expect(weight).toBeCloseTo(1.2, 5);
  });

  it('distance decay reduces weight for farther reports', () => {
    const nearWeight = computeReportWeight({
      createdAt: daysAgo(1),
      observationType: 'supply',
      distanceMiles: 1,
    });
    const farWeight = computeReportWeight({
      createdAt: daysAgo(1),
      observationType: 'supply',
      distanceMiles: 10,
    });
    expect(nearWeight).toBeGreaterThan(farWeight);
  });

  it('distance decay formula: weight = baseWeight * 1/(1+distanceMiles)', () => {
    const weight = computeReportWeight({
      createdAt: daysAgo(1),
      observationType: 'supply',
      distanceMiles: 4,
    });
    // base=1.0, decay=1/(1+4)=0.2, type=1.0 → 0.2
    expect(weight).toBeCloseTo(0.2, 5);
  });
});

// ─── aggregateReportScore ─────────────────────────────────────────────────────

describe('aggregateReportScore', () => {
  it('returns 0 for an empty reports array', () => {
    expect(aggregateReportScore([])).toBe(0);
  });

  it('returns a positive score for a single recent report', () => {
    const report: WeightedReport = {
      id: '1',
      createdAt: daysAgo(1),
      observationType: 'symptom',
      distanceMiles: 0,
      weight: 1.2,
    };
    expect(aggregateReportScore([report])).toBeGreaterThan(0);
  });

  it('returns a higher score for more reports', () => {
    const makeReport = (id: string): WeightedReport => ({
      id,
      createdAt: daysAgo(1),
      observationType: 'symptom',
      distanceMiles: 0,
      weight: 1.2,
    });

    const oneReport = aggregateReportScore([makeReport('1')]);
    const fiveReports = aggregateReportScore([
      makeReport('1'),
      makeReport('2'),
      makeReport('3'),
      makeReport('4'),
      makeReport('5'),
    ]);

    expect(fiveReports).toBeGreaterThan(oneReport);
  });

  it('caps score at 100', () => {
    const reports: WeightedReport[] = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      createdAt: daysAgo(1),
      observationType: 'symptom',
      distanceMiles: 0,
      weight: 1.2,
    }));
    expect(aggregateReportScore(reports)).toBe(100);
  });
});

// ─── getReportCountSummary ────────────────────────────────────────────────────

describe('getReportCountSummary', () => {
  it('returns zeros for an empty array', () => {
    const summary = getReportCountSummary([]);
    expect(summary).toEqual({ total: 0, last7Days: 0, last30Days: 0 });
  });

  it('correctly counts total reports', () => {
    const reports = [
      { createdAt: daysAgo(1) },
      { createdAt: daysAgo(10) },
      { createdAt: daysAgo(45) },
    ];
    const summary = getReportCountSummary(reports);
    expect(summary.total).toBe(3);
  });

  it('correctly counts last 7 days', () => {
    const reports = [
      { createdAt: daysAgo(1) },
      { createdAt: daysAgo(5) },
      { createdAt: daysAgo(10) },
      { createdAt: daysAgo(45) },
    ];
    const summary = getReportCountSummary(reports);
    expect(summary.last7Days).toBe(2);
  });

  it('correctly counts last 30 days', () => {
    const reports = [
      { createdAt: daysAgo(1) },
      { createdAt: daysAgo(5) },
      { createdAt: daysAgo(10) },
      { createdAt: daysAgo(25) },
      { createdAt: daysAgo(45) },
    ];
    const summary = getReportCountSummary(reports);
    expect(summary.last30Days).toBe(4);
  });

  it('last7Days count is always <= last30Days count', () => {
    const reports = [
      { createdAt: daysAgo(2) },
      { createdAt: daysAgo(8) },
      { createdAt: daysAgo(20) },
    ];
    const summary = getReportCountSummary(reports);
    expect(summary.last7Days).toBeLessThanOrEqual(summary.last30Days);
  });

  it('last30Days count is always <= total count', () => {
    const reports = [
      { createdAt: daysAgo(2) },
      { createdAt: daysAgo(8) },
      { createdAt: daysAgo(45) },
    ];
    const summary = getReportCountSummary(reports);
    expect(summary.last30Days).toBeLessThanOrEqual(summary.total);
  });
});
