/**
 * Risk Aggregation Business Logic
 *
 * Pure functions for aggregating risk levels from multiple data sources.
 * Implements data source priority: CDC > WHO > community reports.
 */

export type RiskLevelValue = 'low' | 'moderate' | 'high' | 'critical';

export const RISK_ORDER: Record<RiskLevelValue, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

const RISK_BY_ORDER: RiskLevelValue[] = ['low', 'moderate', 'high', 'critical'];

/**
 * Aggregate multiple risk levels — returns the highest.
 * Empty input returns 'low' (default safe state).
 */
export function aggregateRiskLevel(levels: RiskLevelValue[]): RiskLevelValue {
  if (levels.length === 0) {
    return 'low';
  }

  let maxOrder = 0;
  for (const level of levels) {
    const order = RISK_ORDER[level];
    if (order > maxOrder) {
      maxOrder = order;
    }
  }

  return RISK_BY_ORDER[maxOrder - 1];
}

export interface RiskDataPoint {
  riskLevel: RiskLevelValue;
  confidence: number; // 0-100
  weight: number; // multiplier for this data point
}

/**
 * Calculate a composite risk score (0-100) from multiple data points.
 * Uses a weighted average of risk scores, where each risk level maps to a base score.
 */
export function calculateRiskScore(dataPoints: RiskDataPoint[]): number {
  if (dataPoints.length === 0) {
    return 0;
  }

  const BASE_SCORES: Record<RiskLevelValue, number> = {
    low: 20,
    moderate: 45,
    high: 70,
    critical: 90,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const point of dataPoints) {
    const baseScore = BASE_SCORES[point.riskLevel];
    // Confidence scales the effective weight
    const effectiveWeight = point.weight * (point.confidence / 100);
    weightedSum += baseScore * effectiveWeight;
    totalWeight += effectiveWeight;
  }

  if (totalWeight === 0) {
    return 0;
  }

  return Math.round(Math.min(100, Math.max(0, weightedSum / totalWeight)));
}

/**
 * Determine if community reports should elevate the risk level.
 * Community reports only elevate risk if no official data exists.
 *
 * @param officialRisk - The risk level from official sources (WHO/CDC), or 'low' if none
 * @param communityReportCount - Total number of community reports in the area
 * @param recentReportCount - Number of reports within the last 7 days
 * @returns Potentially elevated risk level
 */
export function applyCommunitySupplement(
  officialRisk: RiskLevelValue,
  communityReportCount: number,
  recentReportCount: number
): RiskLevelValue {
  // Community reports only elevate risk when there is no official data
  // (i.e., officialRisk is 'low' meaning no official source provided a higher level)
  if (officialRisk !== 'low') {
    return officialRisk;
  }

  // Elevate based on recent report volume
  if (recentReportCount >= 10) {
    return 'high';
  }
  if (recentReportCount >= 5) {
    return 'moderate';
  }
  if (communityReportCount >= 10) {
    return 'moderate';
  }

  return officialRisk;
}

/**
 * Source priority constants.
 * CDC has highest confidence for US data, WHO for global, community is supplemental.
 */
export const SOURCE_CONFIDENCE = {
  cdc: 95,
  who: 90,
  community: 60, // default; actual confidence varies per report
} as const;

export type DataSource = 'who' | 'cdc' | 'community';

export interface RiskSourceEntry {
  source: DataSource;
  riskLevel: RiskLevelValue;
  confidence: number;
  timestamp: string;
}

/**
 * Determine the authoritative risk level from a list of source entries,
 * applying data source priority (CDC > WHO > community).
 *
 * @param entries - Risk data from various sources
 * @returns The highest-priority, highest-severity risk level
 */
export function resolveRiskByPriority(entries: RiskSourceEntry[]): RiskLevelValue {
  if (entries.length === 0) {
    return 'low';
  }

  const cdcEntries = entries.filter((e) => e.source === 'cdc');
  const whoEntries = entries.filter((e) => e.source === 'who');
  const communityEntries = entries.filter((e) => e.source === 'community');

  // If CDC data exists, use it (highest priority for US)
  if (cdcEntries.length > 0) {
    return aggregateRiskLevel(cdcEntries.map((e) => e.riskLevel));
  }

  // If WHO data exists, use it
  if (whoEntries.length > 0) {
    return aggregateRiskLevel(whoEntries.map((e) => e.riskLevel));
  }

  // Fall back to community reports
  return aggregateRiskLevel(communityEntries.map((e) => e.riskLevel));
}
