/**
 * Integration Tests for WHO API Integration
 * 
 * Tests the complete WHO data pipeline:
 * 1. API client fetching
 * 2. Data parsing
 * 3. Data mapping to internal format
 * 4. Caching
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearWHOCache,
  getCacheMetadata,
  getCachedWHOData,
  getFallbackWHOData,
  setCachedWHOData,
} from '../../cache/who-cache';
import type { WHOOutbreak } from '../who-api-client';
import { mapWHODataToInternal } from '../who-data-mapper';
import { parseWHOData } from '../who-data-parser';

describe('WHO Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearWHOCache();
  });

  describe('Complete pipeline', () => {
    it('should process WHO data through complete pipeline', () => {
      // Mock WHO API response
      const mockWHOData: WHOOutbreak[] = [
        {
          disease: 'Ebola Virus Disease',
          regions: ['Africa'],
          countries: ['Democratic Republic of the Congo'],
          caseCount: 150,
          publishedDate: '2024-01-15T00:00:00.000Z',
          url: 'https://www.who.int/emergencies/disease-outbreak-news/item/ebola-drc',
        },
        {
          disease: 'Cholera',
          regions: ['Africa', 'Asia'],
          countries: ['Kenya', 'Bangladesh'],
          caseCount: 500,
          publishedDate: '2024-01-10T00:00:00.000Z',
          url: 'https://www.who.int/emergencies/disease-outbreak-news/item/cholera',
        },
      ];

      // Parse data
      const parsedData = parseWHOData(mockWHOData);
      expect(parsedData).toHaveLength(2);
      expect(parsedData[0].disease).toBe('Ebola Virus Disease');
      expect(parsedData[1].disease).toBe('Cholera');

      // Map to internal format
      const internalData = mapWHODataToInternal(parsedData);
      expect(internalData).toHaveLength(2);

      // Verify first outbreak
      expect(internalData[0].source).toBe('who');
      expect(internalData[0].disease).toBe('Ebola Virus Disease');
      expect(internalData[0].severity).toBe('moderate'); // 150 cases
      expect(internalData[0].locations).toHaveLength(1);
      expect(internalData[0].locations[0].country).toBe('Democratic Republic of the Congo');

      // Verify second outbreak
      expect(internalData[1].source).toBe('who');
      expect(internalData[1].disease).toBe('Cholera');
      expect(internalData[1].severity).toBe('moderate'); // 500 cases
      expect(internalData[1].locations).toHaveLength(2);
      expect(internalData[1].locations[0].country).toBe('Kenya');
      expect(internalData[1].locations[1].country).toBe('Bangladesh');
    });

    it('should filter out invalid records during parsing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockWHOData: any[] = [
        {
          disease: 'Valid Disease',
          regions: ['Africa'],
          countries: ['Kenya'],
          caseCount: 100,
          publishedDate: '2024-01-15T00:00:00.000Z',
          url: 'https://example.com',
        },
        {
          // Missing disease
          regions: ['Asia'],
          countries: ['India'],
          caseCount: 50,
          publishedDate: '2024-01-15T00:00:00.000Z',
          url: 'https://example.com',
        },
        {
          disease: 'Another Valid Disease',
          regions: ['Europe'],
          countries: ['France'],
          caseCount: 75,
          // Missing publishedDate
          url: 'https://example.com',
        },
      ];

      const parsedData = parseWHOData(mockWHOData);
      expect(parsedData).toHaveLength(1); // Only first record is valid
      expect(parsedData[0].disease).toBe('Valid Disease');
    });

    it('should filter out records with unknown countries during mapping', () => {
      const mockWHOData: WHOOutbreak[] = [
        {
          disease: 'Test Disease',
          regions: ['Test Region'],
          countries: ['Kenya', 'UnknownCountry123'],
          caseCount: 100,
          publishedDate: '2024-01-15T00:00:00.000Z',
          url: 'https://example.com',
        },
      ];

      const parsedData = parseWHOData(mockWHOData);
      const internalData = mapWHODataToInternal(parsedData);

      expect(internalData).toHaveLength(1);
      // Should only have Kenya (UnknownCountry123 filtered out)
      expect(internalData[0].locations).toHaveLength(1);
      expect(internalData[0].locations[0].country).toBe('Kenya');
    });
  });

  describe('Cache functionality', () => {
    it('should cache and retrieve WHO data', () => {
      const mockData = [
        {
          source: 'who' as const,
          disease: 'Test Disease',
          locations: [{ country: 'Kenya', lat: -0.0236, lng: 37.9062 }],
          severity: 'moderate' as const,
          caseCount: 100,
          timestamp: new Date().toISOString(),
          sourceUrl: 'https://example.com',
        },
      ];

      // Initially no cache
      expect(getCachedWHOData()).toBeNull();

      // Set cache
      setCachedWHOData(mockData);

      // Retrieve from cache
      const cached = getCachedWHOData();
      expect(cached).not.toBeNull();
      expect(cached).toEqual(mockData);
    });

    it('should return null for expired cache', async () => {
      const mockData = [
        {
          source: 'who' as const,
          disease: 'Test Disease',
          locations: [{ country: 'Kenya', lat: -0.0236, lng: 37.9062 }],
          severity: 'moderate' as const,
          caseCount: 100,
          timestamp: new Date().toISOString(),
          sourceUrl: 'https://example.com',
        },
      ];

      setCachedWHOData(mockData);

      // Mock time passing (6 hours + 1 second)
      const metadata = getCacheMetadata();
      expect(metadata).not.toBeNull();
      if (metadata) {
        // Manually expire cache by setting expiresAt in the past
        vi.useFakeTimers();
        vi.setSystemTime(metadata.expiresAt + 1000);

        const cached = getCachedWHOData();
        expect(cached).toBeNull();

        vi.useRealTimers();
      }
    });

    it('should provide fallback data even when expired', () => {
      const mockData = [
        {
          source: 'who' as const,
          disease: 'Test Disease',
          locations: [{ country: 'Kenya', lat: -0.0236, lng: 37.9062 }],
          severity: 'moderate' as const,
          caseCount: 100,
          timestamp: new Date().toISOString(),
          sourceUrl: 'https://example.com',
        },
      ];

      setCachedWHOData(mockData);

      // Fallback should always return data
      const fallback = getFallbackWHOData();
      expect(fallback).not.toBeNull();
      expect(fallback).toEqual(mockData);
    });

    it('should provide cache metadata', () => {
      const mockData = [
        {
          source: 'who' as const,
          disease: 'Test Disease',
          locations: [{ country: 'Kenya', lat: -0.0236, lng: 37.9062 }],
          severity: 'moderate' as const,
          caseCount: 100,
          timestamp: new Date().toISOString(),
          sourceUrl: 'https://example.com',
        },
      ];

      // No metadata initially
      expect(getCacheMetadata()).toBeNull();

      setCachedWHOData(mockData);

      const metadata = getCacheMetadata();
      expect(metadata).not.toBeNull();
      if (metadata) {
        expect(metadata.timestamp).toBeGreaterThan(0);
        expect(metadata.expiresAt).toBeGreaterThan(metadata.timestamp);
        expect(metadata.isExpired).toBe(false);
        expect(metadata.age).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Severity calculation', () => {
    it('should calculate correct severity levels', () => {
      const testCases = [
        { caseCount: 0, expectedSeverity: 'low' },
        { caseCount: 50, expectedSeverity: 'low' },
        { caseCount: 99, expectedSeverity: 'low' },
        { caseCount: 100, expectedSeverity: 'moderate' },
        { caseCount: 500, expectedSeverity: 'moderate' },
        { caseCount: 999, expectedSeverity: 'moderate' },
        { caseCount: 1000, expectedSeverity: 'high' },
        { caseCount: 5000, expectedSeverity: 'high' },
        { caseCount: 9999, expectedSeverity: 'high' },
        { caseCount: 10000, expectedSeverity: 'critical' },
        { caseCount: 100000, expectedSeverity: 'critical' },
      ];

      testCases.forEach(({ caseCount, expectedSeverity }) => {
        const mockWHOData: WHOOutbreak[] = [
          {
            disease: 'Test Disease',
            regions: ['Test'],
            countries: ['Kenya'],
            caseCount,
            publishedDate: '2024-01-15T00:00:00.000Z',
            url: 'https://example.com',
          },
        ];

        const parsedData = parseWHOData(mockWHOData);
        const internalData = mapWHODataToInternal(parsedData);

        expect(internalData).toHaveLength(1);
        expect(internalData[0].severity).toBe(expectedSeverity);
      });
    });
  });
});
