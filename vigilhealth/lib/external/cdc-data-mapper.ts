/**
 * CDC Data Mapper
 * 
 * Maps CDC NNDSS case report data to internal InternalRiskData schema.
 * Normalizes data for storage in the risk_levels table.
 * Uses FIPS code geocoding for location data.
 */

import type { ParsedCDCData } from './cdc-data-parser';
import { geocodeFIPS } from './fips-geocoder';

export interface InternalRiskData {
  source: 'cdc';
  disease: string;
  locations: Array<{
    state: string;
    county: string;
    fipsCode: string;
    lat: number;
    lng: number;
  }>;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  caseCount: number;
  timestamp: string;
  sourceUrl: string;
}

/**
 * Calculates severity level based on case count
 * This is a simplified heuristic. In production, use more sophisticated logic
 * considering population density, disease type, and historical trends.
 * @param caseCount - Number of cases
 * @returns Severity level
 */
function calculateSeverity(caseCount: number): 'low' | 'moderate' | 'high' | 'critical' {
  if (caseCount === 0) return 'low';
  if (caseCount < 50) return 'low';
  if (caseCount < 200) return 'moderate';
  if (caseCount < 1000) return 'high';
  return 'critical';
}

/**
 * Maps parsed CDC data to internal risk data schema
 * @param parsedData - Parsed CDC case report data
 * @returns Internal risk data or null if mapping fails
 */
export function mapCDCToInternal(parsedData: ParsedCDCData): InternalRiskData | null {
  try {
    // Geocode FIPS code to coordinates
    const location = geocodeFIPS(parsedData.fipsCode);
    if (!location) {
      // FIPS code not in our database, skip this record
      return null;
    }

    // Calculate severity based on case count
    const severity = calculateSeverity(parsedData.caseCount);

    // Convert reporting week to ISO timestamp
    // If reportingWeek is in YYYY-Www format, convert to date
    // If it's already a date string, use it directly
    let timestamp: string;
    try {
      // Try parsing as ISO date first
      const date = new Date(parsedData.reportingWeek);
      if (!isNaN(date.getTime())) {
        timestamp = date.toISOString();
      } else {
        // Fallback to current date if parsing fails
        timestamp = new Date().toISOString();
      }
    } catch {
      timestamp = new Date().toISOString();
    }

    // Construct source URL (CDC NNDSS data portal)
    const sourceUrl = 'https://data.cdc.gov/NNDSS/NNDSS-Table-1/pwn4-m3yp';

    return {
      source: 'cdc',
      disease: parsedData.disease,
      locations: [
        {
          state: location.state,
          county: location.county,
          fipsCode: location.fipsCode,
          lat: location.lat,
          lng: location.lng,
        },
      ],
      severity,
      caseCount: parsedData.caseCount,
      timestamp,
      sourceUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Maps multiple parsed CDC data records to internal format
 * @param parsedDataArray - Array of parsed CDC data
 * @returns Array of internal risk data (invalid records filtered out)
 */
export function mapCDCDataToInternal(parsedDataArray: ParsedCDCData[]): InternalRiskData[] {
  if (!Array.isArray(parsedDataArray)) {
    return [];
  }

  return parsedDataArray
    .map(mapCDCToInternal)
    .filter((mapped): mapped is InternalRiskData => mapped !== null);
}
