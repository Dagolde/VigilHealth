/**
 * WHO Data Parser
 * 
 * Parses WHO Disease Outbreak News API responses into structured format.
 * Extracts disease name, regions, countries, and case counts.
 */

import type { WHOOutbreak } from './who-api-client';

export interface ParsedWHOData {
  disease: string;
  regions: string[];
  countries: string[];
  caseCount: number;
  publishedDate: string;
  sourceUrl: string;
}

/**
 * Parses a single WHO outbreak record
 * @param outbreak - Raw WHO outbreak data
 * @returns Parsed WHO data or null if invalid
 */
export function parseWHOOutbreak(outbreak: WHOOutbreak): ParsedWHOData | null {
  try {
    // Validate required fields
    if (!outbreak.disease || typeof outbreak.disease !== 'string') {
      return null;
    }

    if (!outbreak.publishedDate || typeof outbreak.publishedDate !== 'string') {
      return null;
    }

    // Parse disease name (preserve original, but validate not empty after trim)
    const disease = outbreak.disease;
    if (disease.trim().length === 0) {
      return null;
    }

    // Parse regions (ensure array, preserve strings as-is but filter out non-strings)
    const regions = Array.isArray(outbreak.regions)
      ? outbreak.regions.filter((r) => typeof r === 'string')
      : [];

    // Parse countries (ensure array, preserve strings as-is but filter out non-strings)
    const countries = Array.isArray(outbreak.countries)
      ? outbreak.countries.filter((c) => typeof c === 'string')
      : [];

    // Parse case count (default to 0 if not provided or invalid)
    let caseCount = 0;
    if (typeof outbreak.caseCount === 'number' && outbreak.caseCount >= 0) {
      caseCount = Math.floor(outbreak.caseCount);
    } else if (typeof outbreak.caseCount === 'string') {
      const parsed = parseInt(outbreak.caseCount, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        caseCount = parsed;
      }
    }

    // Parse published date (validate ISO format)
    const publishedDate = outbreak.publishedDate.trim();
    const dateObj = new Date(publishedDate);
    if (isNaN(dateObj.getTime())) {
      return null;
    }

    // Parse source URL (default to empty string if not provided)
    const sourceUrl = typeof outbreak.url === 'string' ? outbreak.url.trim() : '';

    return {
      disease,
      regions,
      countries,
      caseCount,
      publishedDate,
      sourceUrl,
    };
  } catch {
    // Return null for any parsing errors
    return null;
  }
}

/**
 * Parses multiple WHO outbreak records
 * @param outbreaks - Array of raw WHO outbreak data
 * @returns Array of parsed WHO data (invalid records are filtered out)
 */
export function parseWHOData(outbreaks: WHOOutbreak[]): ParsedWHOData[] {
  if (!Array.isArray(outbreaks)) {
    return [];
  }

  return outbreaks
    .map(parseWHOOutbreak)
    .filter((parsed): parsed is ParsedWHOData => parsed !== null);
}

/**
 * Formats parsed WHO data back to WHO outbreak format
 * Used for round-trip testing and data export
 * @param parsed - Parsed WHO data
 * @returns WHO outbreak format
 */
export function formatWHOData(parsed: ParsedWHOData): WHOOutbreak {
  return {
    disease: parsed.disease,
    regions: parsed.regions,
    countries: parsed.countries,
    caseCount: parsed.caseCount,
    publishedDate: parsed.publishedDate,
    url: parsed.sourceUrl,
  };
}
