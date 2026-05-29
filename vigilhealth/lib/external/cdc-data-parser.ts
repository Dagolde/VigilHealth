/**
 * CDC NNDSS Data Parser
 * 
 * Parses CDC National Notifiable Diseases Surveillance System API responses
 * into structured format. Extracts disease name, state, county, FIPS codes,
 * and case counts.
 */

import type { CDCCaseReport } from './cdc-api-client';

export interface ParsedCDCData {
  disease: string;
  state: string;
  county: string;
  fipsCode: string;
  caseCount: number;
  reportingWeek: string;
}

/**
 * Parses a single CDC case report record
 * @param report - Raw CDC case report data from Socrata API
 * @returns Parsed CDC data or null if invalid
 */
export function parseCDCReport(report: CDCCaseReport): ParsedCDCData | null {
  try {
    // Validate required fields
    if (!report.disease || typeof report.disease !== 'string') {
      return null;
    }

    if (!report.state || typeof report.state !== 'string') {
      return null;
    }

    if (!report.fipsCode || typeof report.fipsCode !== 'string') {
      return null;
    }

    if (!report.reportingWeek || typeof report.reportingWeek !== 'string') {
      return null;
    }

    // Parse disease name (preserve original, but validate not empty after trim)
    const disease = report.disease.trim();
    if (disease.length === 0) {
      return null;
    }

    // Parse state (preserve original, but validate not empty after trim)
    const state = report.state.trim();
    if (state.length === 0) {
      return null;
    }

    // Parse county (optional, default to empty string)
    const county = typeof report.county === 'string' ? report.county.trim() : '';

    // Parse FIPS code (validate format: 5-digit string)
    const fipsCode = report.fipsCode.trim();
    if (!/^\d{5}$/.test(fipsCode)) {
      return null;
    }

    // Parse case count (default to 0 if not provided or invalid)
    let caseCount = 0;
    if (typeof report.caseCount === 'number' && report.caseCount >= 0) {
      caseCount = Math.floor(report.caseCount);
    } else if (typeof report.caseCount === 'string') {
      const parsed = parseInt(report.caseCount, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        caseCount = parsed;
      }
    }

    // Parse reporting week (validate ISO week format: YYYY-Www)
    const reportingWeek = report.reportingWeek.trim();
    // Basic validation: should match YYYY-Www format or YYYY-MM-DD format
    if (reportingWeek.length === 0) {
      return null;
    }

    return {
      disease,
      state,
      county,
      fipsCode,
      caseCount,
      reportingWeek,
    };
  } catch {
    // Return null for any parsing errors
    return null;
  }
}

/**
 * Parses multiple CDC case report records
 * @param reports - Array of raw CDC case report data
 * @returns Array of parsed CDC data (invalid records are filtered out)
 */
export function parseCDCData(reports: CDCCaseReport[]): ParsedCDCData[] {
  if (!Array.isArray(reports)) {
    return [];
  }

  return reports
    .map(parseCDCReport)
    .filter((parsed): parsed is ParsedCDCData => parsed !== null);
}

/**
 * Formats parsed CDC data back to CDC case report format
 * Used for round-trip testing and data export
 * @param parsed - Parsed CDC data
 * @returns CDC case report format
 */
export function formatCDCData(parsed: ParsedCDCData): CDCCaseReport {
  return {
    disease: parsed.disease,
    state: parsed.state,
    county: parsed.county || undefined,
    fipsCode: parsed.fipsCode,
    caseCount: parsed.caseCount,
    reportingWeek: parsed.reportingWeek,
  };
}
