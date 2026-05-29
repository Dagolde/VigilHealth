/**
 * Property-based tests for risk level aggregation
 *
 * **Validates: Requirements 1.6**
 *
 * Tests the following properties:
 * 1. Monotonicity: If all inputs are at least level X, the aggregated result is at least level X
 * 2. Maximum preservation: Aggregated level ≤ max(inputs) — aggregation cannot invent a higher risk
 * 3. Idempotency: Aggregating the same data twice produces the same result
 * 4. Empty input: Aggregating empty data returns 'low' (default safe state)
 * 5. Single source: Aggregating a single risk point returns that point's risk level
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  RISK_ORDER,
  aggregateRiskLevel,
  applyCommunitySupplement,
  calculateRiskScore,
  resolveRiskByPriority,
  type RiskDataPoint,
  type RiskLevelValue,
  type RiskSourceEntry,
} from '../risk-aggregation';

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const riskLevelArbitrary: fc.Arbitrary<RiskLevelValue> = fc.constantFrom(
  'low',
  'moderate',
  'high',
  'critical'
);

const nonEmptyRiskLevelsArbitrary: fc.Arbitrary<RiskLevelValue[]> = fc.array(
  riskLevelArbitrary,
  { minLength: 1, maxLength: 20 }
);

const riskLevelsArbitrary: fc.Arbitrary<RiskLevelValue[]> = fc.array(
  riskLevelArbitrary,
  { minLength: 0, maxLength: 20 }
);

const riskDataPointArbitrary: fc.Arbitrary<RiskDataPoint> = fc.record({
  riskLevel: riskLevelArbitrary,
  confidence: fc.integer({ min: 0, max: 100 }),
  weight: fc.double({ min: 0.1, max: 2.0, noNaN: true }),
});

const sourceArbitrary: fc.Arbitrary<'who' | 'cdc' | 'community'> = fc.constantFrom(
  'who',
  'cdc',
  'community'
);

const riskSourceEntryArbitrary: fc.Arbitrary<RiskSourceEntry> = fc.record({
  source: sourceArbitrary,
  riskLevel: riskLevelArbitrary,
  confidence: fc.integer({ min: 0, max: 100 }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }).map(
    (d) => d.toISOString()
  ),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function maxRiskLevel(levels: RiskLevelValue[]): RiskLevelValue {
  if (levels.length === 0) return 'low';
  return levels.reduce((max, level) =>
    RISK_ORDER[level] > RISK_ORDER[max] ? level : max
  );
}

function minRiskLevel(levels: RiskLevelValue[]): RiskLevelValue {
  if (levels.length === 0) return 'low';
  return levels.reduce((min, level) =>
    RISK_ORDER[level] < RISK_ORDER[min] ? level : min
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('aggregateRiskLevel — Property-Based Tests', () => {
  describe('Property 4: Empty input returns low', () => {
    it('should return "low" for empty array', () => {
      expect(aggregateRiskLevel([])).toBe('low');
    });
  });

  describe('Property 5: Single source returns that level', () => {
    it('should return the exact risk level for a single-element array', () => {
      fc.assert(
        fc.property(riskLevelArbitrary, (level) => {
          expect(aggregateRiskLevel([level])).toBe(level);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Maximum preservation — result ≤ max(inputs)', () => {
    it('should never produce a risk level higher than the maximum input', () => {
      fc.assert(
        fc.property(nonEmptyRiskLevelsArbitrary, (levels) => {
          const result = aggregateRiskLevel(levels);
          const maxInput = maxRiskLevel(levels);
          expect(RISK_ORDER[result]).toBeLessThanOrEqual(RISK_ORDER[maxInput]);
        }),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 1: Monotonicity — result ≥ min(inputs)', () => {
    it('should return at least the minimum input risk level', () => {
      fc.assert(
        fc.property(nonEmptyRiskLevelsArbitrary, (levels) => {
          const result = aggregateRiskLevel(levels);
          const minInput = minRiskLevel(levels);
          // The aggregate is always >= the minimum input
          expect(RISK_ORDER[result]).toBeGreaterThanOrEqual(RISK_ORDER[minInput]);
        }),
        { numRuns: 1000 }
      );
    });

    it('should return at least level X when all inputs are at least level X', () => {
      fc.assert(
        fc.property(
          riskLevelArbitrary,
          fc.array(riskLevelArbitrary, { minLength: 1, maxLength: 20 }),
          (threshold, baseLevels) => {
            // Ensure all levels are >= threshold
            const levels = baseLevels.map((l) =>
              RISK_ORDER[l] >= RISK_ORDER[threshold] ? l : threshold
            );
            const result = aggregateRiskLevel(levels);
            expect(RISK_ORDER[result]).toBeGreaterThanOrEqual(RISK_ORDER[threshold]);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 3: Idempotency — same data produces same result', () => {
    it('should produce identical results when called twice with the same input', () => {
      fc.assert(
        fc.property(riskLevelsArbitrary, (levels) => {
          const result1 = aggregateRiskLevel(levels);
          const result2 = aggregateRiskLevel(levels);
          expect(result1).toBe(result2);
        }),
        { numRuns: 1000 }
      );
    });

    it('should produce the same result when the same levels are aggregated twice (concatenated)', () => {
      fc.assert(
        fc.property(nonEmptyRiskLevelsArbitrary, (levels) => {
          const result1 = aggregateRiskLevel(levels);
          // Aggregating the same set twice should not change the result
          const result2 = aggregateRiskLevel([...levels, ...levels]);
          expect(result1).toBe(result2);
        }),
        { numRuns: 1000 }
      );
    });
  });

  describe('Risk ordering invariant: low < moderate < high < critical always preserved', () => {
    it('should always return a valid risk level', () => {
      const validLevels = new Set<string>(['low', 'moderate', 'high', 'critical']);
      fc.assert(
        fc.property(riskLevelsArbitrary, (levels) => {
          const result = aggregateRiskLevel(levels);
          expect(validLevels.has(result)).toBe(true);
        }),
        { numRuns: 1000 }
      );
    });

    it('should preserve ordering: result is always the maximum of inputs', () => {
      fc.assert(
        fc.property(nonEmptyRiskLevelsArbitrary, (levels) => {
          const result = aggregateRiskLevel(levels);
          const maxInput = maxRiskLevel(levels);
          // aggregateRiskLevel returns the maximum
          expect(result).toBe(maxInput);
        }),
        { numRuns: 1000 }
      );
    });
  });
});

describe('calculateRiskScore — Property-Based Tests', () => {
  it('should return 0 for empty data points', () => {
    expect(calculateRiskScore([])).toBe(0);
  });

  it('should always return a score in [0, 100]', () => {
    fc.assert(
      fc.property(fc.array(riskDataPointArbitrary, { minLength: 0, maxLength: 20 }), (points) => {
        const score = calculateRiskScore(points);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 1000 }
    );
  });

  it('should return the same score for the same input (idempotency)', () => {
    fc.assert(
      fc.property(fc.array(riskDataPointArbitrary, { minLength: 0, maxLength: 20 }), (points) => {
        const score1 = calculateRiskScore(points);
        const score2 = calculateRiskScore(points);
        expect(score1).toBe(score2);
      }),
      { numRuns: 500 }
    );
  });
});

describe('applyCommunitySupplement — Property-Based Tests', () => {
  it('should never lower the official risk level', () => {
    fc.assert(
      fc.property(
        riskLevelArbitrary,
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (officialRisk, totalCount, recentCount) => {
          const result = applyCommunitySupplement(officialRisk, totalCount, recentCount);
          expect(RISK_ORDER[result]).toBeGreaterThanOrEqual(RISK_ORDER[officialRisk]);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('should not elevate risk when official data is above low', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('moderate' as const, 'high' as const, 'critical' as const),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (officialRisk, totalCount, recentCount) => {
          const result = applyCommunitySupplement(officialRisk, totalCount, recentCount);
          // Official data takes precedence — result must equal officialRisk
          expect(result).toBe(officialRisk);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('should return a valid risk level', () => {
    const validLevels = new Set<string>(['low', 'moderate', 'high', 'critical']);
    fc.assert(
      fc.property(
        riskLevelArbitrary,
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (officialRisk, totalCount, recentCount) => {
          const result = applyCommunitySupplement(officialRisk, totalCount, recentCount);
          expect(validLevels.has(result)).toBe(true);
        }
      ),
      { numRuns: 500 }
    );
  });
});

describe('resolveRiskByPriority — Property-Based Tests', () => {
  it('should return "low" for empty entries', () => {
    expect(resolveRiskByPriority([])).toBe('low');
  });

  it('should always return a valid risk level', () => {
    const validLevels = new Set<string>(['low', 'moderate', 'high', 'critical']);
    fc.assert(
      fc.property(
        fc.array(riskSourceEntryArbitrary, { minLength: 0, maxLength: 20 }),
        (entries) => {
          const result = resolveRiskByPriority(entries);
          expect(validLevels.has(result)).toBe(true);
        }
      ),
      { numRuns: 1000 }
    );
  });

  it('should prefer CDC over WHO when both are present', () => {
    fc.assert(
      fc.property(
        riskLevelArbitrary,
        riskLevelArbitrary,
        (cdcLevel, whoLevel) => {
          const entries: RiskSourceEntry[] = [
            { source: 'cdc', riskLevel: cdcLevel, confidence: 95, timestamp: new Date().toISOString() },
            { source: 'who', riskLevel: whoLevel, confidence: 90, timestamp: new Date().toISOString() },
          ];
          const result = resolveRiskByPriority(entries);
          // CDC takes priority — result should match CDC level
          expect(result).toBe(cdcLevel);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('should prefer WHO over community when CDC is absent', () => {
    fc.assert(
      fc.property(
        riskLevelArbitrary,
        riskLevelArbitrary,
        (whoLevel, communityLevel) => {
          const entries: RiskSourceEntry[] = [
            { source: 'who', riskLevel: whoLevel, confidence: 90, timestamp: new Date().toISOString() },
            { source: 'community', riskLevel: communityLevel, confidence: 60, timestamp: new Date().toISOString() },
          ];
          const result = resolveRiskByPriority(entries);
          // WHO takes priority over community
          expect(result).toBe(whoLevel);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('should be idempotent — same entries produce same result', () => {
    fc.assert(
      fc.property(
        fc.array(riskSourceEntryArbitrary, { minLength: 0, maxLength: 20 }),
        (entries) => {
          const result1 = resolveRiskByPriority(entries);
          const result2 = resolveRiskByPriority(entries);
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 500 }
    );
  });
});
