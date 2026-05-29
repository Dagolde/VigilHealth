/**
 * Integration Tests for CDC NNDSS Integration
 * 
 * Tests the complete CDC data flow:
 * API client → Parser → Mapper → Cache
 */

import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearCDCCache,
  getCacheMetadata,
  getCachedCDCData,
  getFallbackCDCData,
  setCachedCDCData,
} from '@/lib/cache/cdc-cache';

import type { CDCCaseReport } from '../cdc-api-client';
import { mapCDCDataToInternal } from '../cdc-data-mapper';
import { parseCDCData } from '../cdc-data-parser';
import { geocodeFIPS, isFIPSSupported } from '../fips-geocoder';
describe('CDC NNDSS Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCDCCache();
  });

  describe('FIPS Geocoder', () => {
    it('should geocode valid FIPS codes', () => {
      const location = geocodeFIPS('06037'); // Los Angeles County
      expect(location).not.toBeNull();
      expect(location?.state).toBe('California');
      expect(location?.county).toBe('Los Angeles');
      expect(location?.lat).toBeCloseTo(34.0522, 2);
      expect(location?.lng).toBeCloseTo(-118.2437, 2);
    });

    it('should return null for unknown FIPS codes', () => {
      const location = geocodeFIPS('99999');
      expect(location).toBeNull();
    });

    it('should check if FIPS code is supported', () => {
      expect(isFIPSSupported('06037')).toBe(true);
      expect(isFIPSSupported('99999')).toBe(false);
    });
  });

  describe('CDC Data Parser', () => {
    it('should parse valid CDC case reports', () => {
      const reports: CDCCaseReport[] = [
        {
          disease: 'COVID-19',
          state: 'California',
          county: 'Los Angeles',
          fipsCode: '06037',
          caseCount: 150,
          reportingWeek: '2024-01-15',
        },
        {
          disease: 'Influenza',
          state: 'New York',
          county: 'New York',
          fipsCode: '36061',
          caseCount: 75,
          reportingWeek: '2024-01-15',
        },
      ];

      const parsed = parseCDCData(reports);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].disease).toBe('COVID-19');
      expect(parsed[0].state).toBe('California');
      expect(parsed[0].fipsCode).toBe('06037');
      expect(parsed[0].caseCount).toBe(150);
    });

    it('should filter out invalid records', () => {
      const reports: CDCCaseReport[] = [
        {
          disease: 'COVID-19',
          state: 'California',
          county: 'Los Angeles',
          fipsCode: '06037',
          caseCount: 150,
          reportingWeek: '2024-01-15',
        },
        {
          disease: '', // Invalid: empty disease
          state: 'New York',
          county: 'New York',
          fipsCode: '36061',
          caseCount: 75,
          reportingWeek: '2024-01-15',
        },
        {
          disease: 'Influenza',
          state: 'Texas',
          county: 'Harris',
          fipsCode: 'INVALID', // Invalid: not 5 digits
          caseCount: 50,
          reportingWeek: '2024-01-15',
        },
      ];

      const parsed = parseCDCData(reports);
      expect(parsed).toHaveLength(1); // Only first record is valid
      expect(parsed[0].disease).toBe('COVID-19');
    });
  });

  describe('CDC Data Mapper', () => {
    it('should map parsed CDC data to internal format', () => {
      const reports: CDCCaseReport[] = [
        {
          disease: 'COVID-19',
          state: 'California',
          county: 'Los Angeles',
          fipsCode: '06037',
          caseCount: 150,
          reportingWeek: '2024-01-15',
        },
      ];

      const parsed = parseCDCData(reports);
      const mapped = mapCDCDataToInternal(parsed);

      expect(mapped).toHaveLength(1);
      expect(mapped[0].source).toBe('cdc');
      expect(mapped[0].disease).toBe('COVID-19');
      expect(mapped[0].locations).toHaveLength(1);
      expect(mapped[0].locations[0].state).toBe('California');
      expect(mapped[0].locations[0].county).toBe('Los Angeles');
      expect(mapped[0].locations[0].fipsCode).toBe('06037');
      expect(mapped[0].locations[0].lat).toBeCloseTo(34.0522, 2);
      expect(mapped[0].locations[0].lng).toBeCloseTo(-118.2437, 2);
      expect(mapped[0].caseCount).toBe(150);
      expect(mapped[0].severity).toBe('moderate'); // 150 cases = moderate
    });

    it('should calculate severity based on case count', () => {
      const testCases = [
        { caseCount: 10, expectedSeverity: 'low' },
        { caseCount: 75, expectedSeverity: 'moderate' },
        { caseCount: 500, expectedSeverity: 'high' },
        { caseCount: 2000, expectedSeverity: 'critical' },
      ];

      testCases.forEach(({ caseCount, expectedSeverity }) => {
        const reports: CDCCaseReport[] = [
          {
            disease: 'Test Disease',
            state: 'California',
            county: 'Los Angeles',
            fipsCode: '06037',
            caseCount,
            reportingWeek: '2024-01-15',
          },
        ];

        const parsed = parseCDCData(reports);
        const mapped = mapCDCDataToInternal(parsed);

        expect(mapped[0].severity).toBe(expectedSeverity);
      });
    });

    it('should filter out records with unsupported FIPS codes', () => {
      const reports: CDCCaseReport[] = [
        {
          disease: 'COVID-19',
          state: 'California',
          county: 'Los Angeles',
          fipsCode: '06037', // Supported
          caseCount: 150,
          reportingWeek: '2024-01-15',
        },
        {
          disease: 'Influenza',
          state: 'Unknown',
          county: 'Unknown',
          fipsCode: '99999', // Not supported
          caseCount: 75,
          reportingWeek: '2024-01-15',
        },
      ];

      const parsed = parseCDCData(reports);
      const mapped = mapCDCDataToInternal(parsed);

      expect(mapped).toHaveLength(1); // Only first record has supported FIPS
      expect(mapped[0].disease).toBe('COVID-19');
    });
  });

  describe('CDC Cache', () => {
    it('should cache and retrieve CDC data', () => {
      const data = [
        {
          source: 'cdc' as const,
          disease: 'COVID-19',
          locations: [
            {
              state: 'California',
              county: 'Los Angeles',
              fipsCode: '06037',
              lat: 34.0522,
              lng: -118.2437,
            },
          ],
          severity: 'moderate' as const,
          caseCount: 150,
          timestamp: new Date().toISOString(),
          sourceUrl: 'https://data.cdc.gov/NNDSS/NNDSS-Table-1/pwn4-m3yp',
        },
      ];

      setCachedCDCData(data);

      const cached = getCachedCDCData();
      expect(cached).not.toBeNull();
      expect(cached).toHaveLength(1);
      expect(cached![0].disease).toBe('COVID-19');
    });

    it('should return null when cache is empty', () => {
      const cached = getCachedCDCData();
      expect(cached).toBeNull();
    });

    it('should provide fallback data even when expired', () => {
      const data = [
        {
          source: 'cdc' as const,
          disease: 'COVID-19',
          locations: [
            {
              state: 'California',
              county: 'Los Angeles',
              fipsCode: '06037',
              lat: 34.0522,
              lng: -118.2437,
            },
          ],
          severity: 'moderate' as const,
          caseCount: 150,
          timestamp: new Date().toISOString(),
          sourceUrl: 'https://data.cdc.gov/NNDSS/NNDSS-Table-1/pwn4-m3yp',
        },
      ];

      setCachedCDCData(data);

      const fallback = getFallbackCDCData();
      expect(fallback).not.toBeNull();
      expect(fallback).toHaveLength(1);
    });

    it('should provide cache metadata', () => {
      const data = [
        {
          source: 'cdc' as const,
          disease: 'COVID-19',
          locations: [
            {
              state: 'California',
              county: 'Los Angeles',
              fipsCode: '06037',
              lat: 34.0522,
              lng: -118.2437,
            },
          ],
          severity: 'moderate' as const,
          caseCount: 150,
          timestamp: new Date().toISOString(),
          sourceUrl: 'https://data.cdc.gov/NNDSS/NNDSS-Table-1/pwn4-m3yp',
        },
      ];

      setCachedCDCData(data);

      const metadata = getCacheMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata!.timestamp).toBeDefined();
      expect(metadata!.expiresAt).toBeDefined();
      expect(metadata!.isExpired).toBe(false);
      expect(metadata!.age).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache', () => {
      const data = [
        {
          source: 'cdc' as const,
          disease: 'COVID-19',
          locations: [
            {
              state: 'California',
              county: 'Los Angeles',
              fipsCode: '06037',
              lat: 34.0522,
              lng: -118.2437,
            },
          ],
          severity: 'moderate' as const,
          caseCount: 150,
          timestamp: new Date().toISOString(),
          sourceUrl: 'https://data.cdc.gov/NNDSS/NNDSS-Table-1/pwn4-m3yp',
        },
      ];

      setCachedCDCData(data);
      expect(getCachedCDCData()).not.toBeNull();

      clearCDCCache();
      expect(getCachedCDCData()).toBeNull();
    });
  });

  describe('Complete CDC Data Flow', () => {
    it('should process CDC data from raw to internal format', () => {
      // Simulate raw CDC API response
      const rawReports: CDCCaseReport[] = [
        {
          disease: 'COVID-19',
          state: 'California',
          county: 'Los Angeles',
          fipsCode: '06037',
          caseCount: 150,
          reportingWeek: '2024-01-15',
        },
        {
          disease: 'Influenza',
          state: 'New York',
          county: 'New York',
          fipsCode: '36061',
          caseCount: 75,
          reportingWeek: '2024-01-15',
        },
        {
          disease: 'Measles',
          state: 'Texas',
          county: 'Harris',
          fipsCode: '48201',
          caseCount: 25,
          reportingWeek: '2024-01-15',
        },
      ];

      // Parse
      const parsed = parseCDCData(rawReports);
      expect(parsed).toHaveLength(3);

      // Map to internal format
      const mapped = mapCDCDataToInternal(parsed);
      expect(mapped).toHaveLength(3);

      // Verify all records have valid locations
      mapped.forEach((record) => {
        expect(record.source).toBe('cdc');
        expect(record.locations).toHaveLength(1);
        expect(record.locations[0].lat).toBeDefined();
        expect(record.locations[0].lng).toBeDefined();
        expect(record.locations[0].fipsCode).toMatch(/^\d{5}$/);
      });

      // Cache the data
      setCachedCDCData(mapped);

      // Retrieve from cache
      const cached = getCachedCDCData();
      expect(cached).toEqual(mapped);
    });
  });
});
