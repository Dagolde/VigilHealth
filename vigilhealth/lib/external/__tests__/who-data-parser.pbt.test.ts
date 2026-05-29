/**
 * Property-Based Tests for WHO Data Parser
 * 
 * **Validates: Requirements 21.6**
 * 
 * Tests the round-trip property: parse → format → parse produces equivalent data
 * This ensures data integrity through the transformation pipeline.
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

import type { ParsedWHOData } from '../who-data-parser';
import {
  formatWHOData,
  parseWHOData,
  parseWHOOutbreak,
} from '../who-data-parser';

describe('WHO Data Parser - Property-Based Tests', () => {
  // Arbitrary generator for valid WHO outbreak data
  const validWHOOutbreakArbitrary = fc.record({
    disease: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    regions: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
    countries: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 20 }),
    caseCount: fc.oneof(
      fc.integer({ min: 0, max: 1000000 }),
      fc.constant(undefined)
    ),
    publishedDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map((d) => d.toISOString()),
    url: fc.webUrl(),
  });

  // Arbitrary generator for parsed WHO data
  const parsedWHODataArbitrary = fc.record({
    disease: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    regions: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 10 }),
    countries: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 20 }),
    caseCount: fc.integer({ min: 0, max: 1000000 }),
    publishedDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map((d) => d.toISOString()),
    sourceUrl: fc.webUrl(),
  });

  describe('Round-trip property: parse → format → parse', () => {
    it('should produce semantically equivalent data after round-trip', () => {
      fc.assert(
        fc.property(validWHOOutbreakArbitrary, (outbreak) => {
          // Parse the outbreak
          const parsed = parseWHOOutbreak(outbreak);

          // Skip if parsing failed (invalid data)
          if (parsed === null) {
            return true;
          }

          // Format back to WHO format
          const formatted = formatWHOData(parsed);

          // Parse again
          const reparsed = parseWHOOutbreak(formatted);

          // Should not be null
          expect(reparsed).not.toBeNull();

          if (reparsed === null) {
            return false;
          }

          // Check semantic equivalence
          expect(reparsed.disease).toBe(parsed.disease);
          expect(reparsed.regions).toEqual(parsed.regions);
          expect(reparsed.countries).toEqual(parsed.countries);
          expect(reparsed.caseCount).toBe(parsed.caseCount);
          expect(reparsed.sourceUrl).toBe(parsed.sourceUrl);

          // Published dates should be equivalent (same timestamp)
          const date1 = new Date(reparsed.publishedDate).getTime();
          const date2 = new Date(parsed.publishedDate).getTime();
          expect(date1).toBe(date2);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve disease name through round-trip', () => {
      fc.assert(
        fc.property(parsedWHODataArbitrary, (parsed) => {
          const formatted = formatWHOData(parsed);
          const reparsed = parseWHOOutbreak(formatted);

          expect(reparsed).not.toBeNull();
          if (reparsed === null) return false;

          expect(reparsed.disease).toBe(parsed.disease);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve regions array through round-trip', () => {
      fc.assert(
        fc.property(parsedWHODataArbitrary, (parsed) => {
          const formatted = formatWHOData(parsed);
          const reparsed = parseWHOOutbreak(formatted);

          expect(reparsed).not.toBeNull();
          if (reparsed === null) return false;

          expect(reparsed.regions).toEqual(parsed.regions);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve countries array through round-trip', () => {
      fc.assert(
        fc.property(parsedWHODataArbitrary, (parsed) => {
          const formatted = formatWHOData(parsed);
          const reparsed = parseWHOOutbreak(formatted);

          expect(reparsed).not.toBeNull();
          if (reparsed === null) return false;

          expect(reparsed.countries).toEqual(parsed.countries);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve case count through round-trip', () => {
      fc.assert(
        fc.property(parsedWHODataArbitrary, (parsed) => {
          const formatted = formatWHOData(parsed);
          const reparsed = parseWHOOutbreak(formatted);

          expect(reparsed).not.toBeNull();
          if (reparsed === null) return false;

          expect(reparsed.caseCount).toBe(parsed.caseCount);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve source URL through round-trip', () => {
      fc.assert(
        fc.property(parsedWHODataArbitrary, (parsed) => {
          const formatted = formatWHOData(parsed);
          const reparsed = parseWHOOutbreak(formatted);

          expect(reparsed).not.toBeNull();
          if (reparsed === null) return false;

          expect(reparsed.sourceUrl).toBe(parsed.sourceUrl);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve timestamp through round-trip', () => {
      fc.assert(
        fc.property(parsedWHODataArbitrary, (parsed) => {
          const formatted = formatWHOData(parsed);
          const reparsed = parseWHOOutbreak(formatted);

          expect(reparsed).not.toBeNull();
          if (reparsed === null) return false;

          // Timestamps should be equivalent (same milliseconds)
          const time1 = new Date(reparsed.publishedDate).getTime();
          const time2 = new Date(parsed.publishedDate).getTime();
          expect(time1).toBe(time2);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Array parsing round-trip', () => {
    it('should preserve all valid records through array round-trip', () => {
      fc.assert(
        fc.property(
          fc.array(validWHOOutbreakArbitrary, { minLength: 1, maxLength: 20 }),
          (outbreaks) => {
            // Parse array
            const parsed = parseWHOData(outbreaks);

            // Format all parsed records back
            const formatted = parsed.map(formatWHOData);

            // Parse again
            const reparsed = parseWHOData(formatted);

            // Should have same number of valid records
            expect(reparsed.length).toBe(parsed.length);

            // Each record should be semantically equivalent
            for (let i = 0; i < parsed.length; i++) {
              expect(reparsed[i].disease).toBe(parsed[i].disease);
              expect(reparsed[i].regions).toEqual(parsed[i].regions);
              expect(reparsed[i].countries).toEqual(parsed[i].countries);
              expect(reparsed[i].caseCount).toBe(parsed[i].caseCount);
              expect(reparsed[i].sourceUrl).toBe(parsed[i].sourceUrl);

              const time1 = new Date(reparsed[i].publishedDate).getTime();
              const time2 = new Date(parsed[i].publishedDate).getTime();
              expect(time1).toBe(time2);
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty arrays in round-trip', () => {
      const parsed: ParsedWHOData = {
        disease: 'Test Disease',
        regions: [],
        countries: [],
        caseCount: 0,
        publishedDate: new Date().toISOString(),
        sourceUrl: 'https://example.com',
      };

      const formatted = formatWHOData(parsed);
      const reparsed = parseWHOOutbreak(formatted);

      expect(reparsed).not.toBeNull();
      if (reparsed === null) return;

      expect(reparsed.regions).toEqual([]);
      expect(reparsed.countries).toEqual([]);
    });

    it('should handle zero case count in round-trip', () => {
      const parsed: ParsedWHOData = {
        disease: 'Test Disease',
        regions: ['Africa'],
        countries: ['Kenya'],
        caseCount: 0,
        publishedDate: new Date().toISOString(),
        sourceUrl: 'https://example.com',
      };

      const formatted = formatWHOData(parsed);
      const reparsed = parseWHOOutbreak(formatted);

      expect(reparsed).not.toBeNull();
      if (reparsed === null) return;

      expect(reparsed.caseCount).toBe(0);
    });

    it('should handle large case counts in round-trip', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1000000, max: 10000000 }),
          (largeCaseCount) => {
            const parsed: ParsedWHOData = {
              disease: 'Test Disease',
              regions: ['Global'],
              countries: ['Multiple'],
              caseCount: largeCaseCount,
              publishedDate: new Date().toISOString(),
              sourceUrl: 'https://example.com',
            };

            const formatted = formatWHOData(parsed);
            const reparsed = parseWHOOutbreak(formatted);

            expect(reparsed).not.toBeNull();
            if (reparsed === null) return false;

            expect(reparsed.caseCount).toBe(largeCaseCount);
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle special characters in disease names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          (diseaseName) => {
            const parsed: ParsedWHOData = {
              disease: diseaseName,
              regions: ['Test'],
              countries: ['Test'],
              caseCount: 100,
              publishedDate: new Date().toISOString(),
              sourceUrl: 'https://example.com',
            };

            const formatted = formatWHOData(parsed);
            const reparsed = parseWHOOutbreak(formatted);

            expect(reparsed).not.toBeNull();
            if (reparsed === null) return false;

            // Disease name should be preserved (with whitespace normalized)
            expect(reparsed.disease.trim()).toBe(diseaseName.trim());
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Idempotence property', () => {
    it('should be idempotent: format(parse(format(parse(x)))) === format(parse(x))', () => {
      fc.assert(
        fc.property(validWHOOutbreakArbitrary, (outbreak) => {
          const parsed1 = parseWHOOutbreak(outbreak);
          if (parsed1 === null) return true;

          const formatted1 = formatWHOData(parsed1);
          const parsed2 = parseWHOOutbreak(formatted1);
          if (parsed2 === null) return false;

          const formatted2 = formatWHOData(parsed2);

          // formatted1 and formatted2 should be deeply equal
          expect(formatted2).toEqual(formatted1);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
