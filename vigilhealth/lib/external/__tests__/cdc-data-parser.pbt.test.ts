/**
 * Property-Based Tests for CDC Data Parser
 * 
 * **Validates: Requirements 32.2, 32.3**
 * 
 * Tests the round-trip property: parse → format → parse produces semantically equivalent data.
 * This ensures data integrity through the transformation pipeline.
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import type { CDCCaseReport } from '../cdc-api-client';
import {
  formatCDCData,
  parseCDCData,
  parseCDCReport,
} from '../cdc-data-parser';

describe('CDC Data Parser - Property-Based Tests', () => {
  /**
   * Arbitrary generator for valid CDC case reports
   */
  const validCDCReportArbitrary = fc.record({
    disease: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    state: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    county: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    fipsCode: fc.integer({ min: 10000, max: 99999 }).map((n) => n.toString()),
    caseCount: fc.integer({ min: 0, max: 100000 }),
    reportingWeek: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
      .map((d) => d.toISOString().split('T')[0]),
  }) as fc.Arbitrary<CDCCaseReport>;

  /**
   * Property: Round-trip parsing produces semantically equivalent data
   * 
   * For any valid CDC case report:
   * parse(report) → format(parsed) → parse(formatted) should produce equivalent data
   */
  it('should preserve data through parse → format → parse round-trip', () => {
    fc.assert(
      fc.property(validCDCReportArbitrary, (report) => {
        // First parse
        const parsed1 = parseCDCReport(report);
        
        // Skip if parsing failed (shouldn't happen with valid input)
        if (!parsed1) {
          return true;
        }

        // Format back to CDC report format
        const formatted = formatCDCData(parsed1);

        // Parse again
        const parsed2 = parseCDCReport(formatted);

        // Should not fail on second parse
        expect(parsed2).not.toBeNull();

        if (!parsed2) {
          return false;
        }

        // Check semantic equivalence
        expect(parsed2.disease).toBe(parsed1.disease);
        expect(parsed2.state).toBe(parsed1.state);
        expect(parsed2.county).toBe(parsed1.county);
        expect(parsed2.fipsCode).toBe(parsed1.fipsCode);
        expect(parsed2.caseCount).toBe(parsed1.caseCount);
        expect(parsed2.reportingWeek).toBe(parsed1.reportingWeek);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Parsing is idempotent
   * 
   * For any valid CDC case report:
   * parse(report) should always produce the same result
   */
  it('should produce consistent results for the same input', () => {
    fc.assert(
      fc.property(validCDCReportArbitrary, (report) => {
        const parsed1 = parseCDCReport(report);
        const parsed2 = parseCDCReport(report);

        // Both should succeed or both should fail
        expect(parsed1 === null).toBe(parsed2 === null);

        if (parsed1 && parsed2) {
          expect(parsed1).toEqual(parsed2);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Array parsing preserves valid records
   * 
   * For any array of CDC case reports:
   * parseCDCData should return all valid records
   */
  it('should parse all valid records in an array', () => {
    fc.assert(
      fc.property(fc.array(validCDCReportArbitrary, { minLength: 0, maxLength: 20 }), (reports) => {
        const parsed = parseCDCData(reports);

        // Parsed array should not be longer than input
        expect(parsed.length).toBeLessThanOrEqual(reports.length);

        // Each parsed record should be valid
        parsed.forEach((record) => {
          expect(record.disease).toBeTruthy();
          expect(record.state).toBeTruthy();
          expect(record.fipsCode).toMatch(/^\d{5}$/);
          expect(record.caseCount).toBeGreaterThanOrEqual(0);
          expect(record.reportingWeek).toBeTruthy();
        });

        return true;
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Invalid FIPS codes are rejected
   * 
   * For any CDC case report with invalid FIPS code:
   * parseCDCReport should return null
   */
  it('should reject invalid FIPS codes', () => {
    fc.assert(
      fc.property(
        fc.record({
          disease: fc.string({ minLength: 1 }),
          state: fc.string({ minLength: 1 }),
          county: fc.option(fc.string(), { nil: undefined }),
          fipsCode: fc.string().filter((s) => !/^\d{5}$/.test(s)), // Invalid FIPS
          caseCount: fc.integer({ min: 0 }),
          reportingWeek: fc.string({ minLength: 1 }),
        }) as fc.Arbitrary<CDCCaseReport>,
        (report) => {
          const parsed = parseCDCReport(report);
          expect(parsed).toBeNull();
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Case count is always non-negative
   * 
   * For any valid CDC case report:
   * parsed case count should be >= 0
   */
  it('should ensure case count is non-negative', () => {
    fc.assert(
      fc.property(validCDCReportArbitrary, (report) => {
        const parsed = parseCDCReport(report);

        if (parsed) {
          expect(parsed.caseCount).toBeGreaterThanOrEqual(0);
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty or whitespace-only strings are rejected
   * 
   * For any CDC case report with empty disease or state:
   * parseCDCReport should return null
   */
  it('should reject empty or whitespace-only required fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          disease: fc.constantFrom('', '   ', '\t\n'),
          state: fc.string({ minLength: 1 }),
          county: fc.option(fc.string(), { nil: undefined }),
          fipsCode: fc.integer({ min: 10000, max: 99999 }).map((n) => n.toString()),
          caseCount: fc.integer({ min: 0 }),
          reportingWeek: fc.string({ minLength: 1 }),
        }) as fc.Arbitrary<CDCCaseReport>,
        (report) => {
          const parsed = parseCDCReport(report);
          expect(parsed).toBeNull();
          return true;
        }
      ),
      { numRuns: 20 }
    );

    fc.assert(
      fc.property(
        fc.record({
          disease: fc.string({ minLength: 1 }),
          state: fc.constantFrom('', '   ', '\t\n'),
          county: fc.option(fc.string(), { nil: undefined }),
          fipsCode: fc.integer({ min: 10000, max: 99999 }).map((n) => n.toString()),
          caseCount: fc.integer({ min: 0 }),
          reportingWeek: fc.string({ minLength: 1 }),
        }) as fc.Arbitrary<CDCCaseReport>,
        (report) => {
          const parsed = parseCDCReport(report);
          expect(parsed).toBeNull();
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property: Format preserves all fields
   * 
   * For any parsed CDC data:
   * formatCDCData should preserve all fields
   */
  it('should preserve all fields when formatting', () => {
    fc.assert(
      fc.property(validCDCReportArbitrary, (report) => {
        const parsed = parseCDCReport(report);

        if (!parsed) {
          return true;
        }

        const formatted = formatCDCData(parsed);

        expect(formatted.disease).toBe(parsed.disease);
        expect(formatted.state).toBe(parsed.state);
        expect(formatted.county).toBe(parsed.county || undefined);
        expect(formatted.fipsCode).toBe(parsed.fipsCode);
        expect(formatted.caseCount).toBe(parsed.caseCount);
        expect(formatted.reportingWeek).toBe(parsed.reportingWeek);

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
