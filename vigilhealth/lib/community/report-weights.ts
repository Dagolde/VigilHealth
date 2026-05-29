/**
 * Report Weighting Logic
 *
 * Pure functions for computing community report weights and aggregating
 * them into a risk score. Recent reports are weighted higher.
 */

export interface WeightedReport {
  id: string;
  createdAt: string;
  observationType: 'symptom' | 'supply' | 'other';
  distanceMiles: number;
  weight: number; // computed weight
}

/**
 * Compute weight for a single report.
 *
 * Time decay:
 *   - Recent (< 7 days):   base weight = 1.0
 *   - Older (7-30 days):   base weight = 0.5
 *   - Very old (> 30 days): base weight = 0.1
 *
 * Distance decay: multiply by 1 / (1 + distanceMiles)
 *
 * Type boost: symptom reports multiplied by 1.2
 */
export function computeReportWeight(report: {
  createdAt: string;
  observationType: string;
  distanceMiles: number;
}): number {
  const now = Date.now();
  const createdMs = new Date(report.createdAt).getTime();
  const ageMs = now - createdMs;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  // Time-based base weight
  let baseWeight: number;
  if (ageDays < 7) {
    baseWeight = 1.0;
  } else if (ageDays <= 30) {
    baseWeight = 0.5;
  } else {
    baseWeight = 0.1;
  }

  // Distance decay
  const distanceDecay = 1 / (1 + report.distanceMiles);

  // Type boost
  const typeMultiplier = report.observationType === 'symptom' ? 1.2 : 1.0;

  return baseWeight * distanceDecay * typeMultiplier;
}

/**
 * Aggregate weighted reports into a community risk score (0-100).
 *
 * Uses the sum of weights, capped at 100.
 * Each report contributes its weight to the total score.
 * Score is scaled so that ~10 recent nearby symptom reports = 100.
 */
export function aggregateReportScore(reports: WeightedReport[]): number {
  if (reports.length === 0) {
    return 0;
  }

  const totalWeight = reports.reduce((sum, r) => sum + r.weight, 0);

  // Scale: a single recent, nearby symptom report has weight ~1.2
  // We scale so that ~10 such reports = 100
  const SCALE_FACTOR = 100 / 12; // 12 = 10 reports × 1.2 max weight each
  const score = totalWeight * SCALE_FACTOR;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Get report count summary for display.
 */
export function getReportCountSummary(reports: Array<{ createdAt: string }>): {
  total: number;
  last7Days: number;
  last30Days: number;
} {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  let last7Days = 0;
  let last30Days = 0;

  for (const report of reports) {
    const ageMs = now - new Date(report.createdAt).getTime();
    if (ageMs <= sevenDaysMs) {
      last7Days++;
      last30Days++;
    } else if (ageMs <= thirtyDaysMs) {
      last30Days++;
    }
  }

  return {
    total: reports.length,
    last7Days,
    last30Days,
  };
}
