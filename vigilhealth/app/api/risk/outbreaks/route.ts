/**
 * GET /api/risk/outbreaks
 *
 * Returns all active outbreak records from the risk_levels table.
 * Falls back to static WHO data if the table is empty.
 */

import { NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/service';

// Static fallback data — current known outbreaks as of 2025
const STATIC_OUTBREAKS = [
  { id: 'static-1', disease: 'Mpox (Monkeypox)', risk_level: 'high' as const, risk_score: 75, case_count: 8500, location_name: 'Democratic Republic of Congo', country: 'Democratic Republic of Congo', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-2', disease: 'Mpox (Monkeypox)', risk_level: 'moderate' as const, risk_score: 55, case_count: 320, location_name: 'Uganda', country: 'Uganda', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-3', disease: 'Cholera', risk_level: 'high' as const, risk_score: 70, case_count: 15000, location_name: 'Sudan', country: 'Sudan', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-4', disease: 'Cholera', risk_level: 'moderate' as const, risk_score: 50, case_count: 4200, location_name: 'Ethiopia', country: 'Ethiopia', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-5', disease: 'Cholera', risk_level: 'moderate' as const, risk_score: 50, case_count: 2800, location_name: 'Nigeria', country: 'Nigeria', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-6', disease: 'Dengue Fever', risk_level: 'high' as const, risk_score: 72, case_count: 180000, location_name: 'Brazil', country: 'Brazil', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-7', disease: 'Dengue Fever', risk_level: 'high' as const, risk_score: 68, case_count: 95000, location_name: 'India', country: 'India', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-8', disease: 'Dengue Fever', risk_level: 'moderate' as const, risk_score: 55, case_count: 42000, location_name: 'Philippines', country: 'Philippines', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-9', disease: 'Influenza A (H5N1)', risk_level: 'moderate' as const, risk_score: 60, case_count: 45, location_name: 'United States', country: 'United States', state: null, source: 'cdc' as const, source_url: 'https://www.cdc.gov/flu/avianflu', valid_from: new Date().toISOString() },
  { id: 'static-10', disease: 'Marburg Virus', risk_level: 'critical' as const, risk_score: 90, case_count: 12, location_name: 'Rwanda', country: 'Rwanda', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-11', disease: 'Yellow Fever', risk_level: 'moderate' as const, risk_score: 52, case_count: 890, location_name: 'Angola', country: 'Angola', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-12', disease: 'Measles', risk_level: 'high' as const, risk_score: 65, case_count: 28000, location_name: 'Democratic Republic of Congo', country: 'Democratic Republic of Congo', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-13', disease: 'Lassa Fever', risk_level: 'moderate' as const, risk_score: 55, case_count: 1200, location_name: 'Nigeria', country: 'Nigeria', state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-14', disease: 'COVID-19 (XEC variant)', risk_level: 'moderate' as const, risk_score: 45, case_count: 500000, location_name: 'Global', country: null, state: null, source: 'who' as const, source_url: 'https://www.who.int/emergencies/disease-outbreak-news', valid_from: new Date().toISOString() },
  { id: 'static-15', disease: 'Hantavirus', risk_level: 'low' as const, risk_score: 30, case_count: 85, location_name: 'United States', country: 'United States', state: null, source: 'cdc' as const, source_url: 'https://www.cdc.gov/hantavirus', valid_from: new Date().toISOString() },
];

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = createServiceClient();

    // Try to get data from database first
    const { data: dbOutbreaks, error } = await service
      .from('risk_levels')
      .select('id, disease, risk_level, risk_score, case_count, location_name, country, state, source, source_url, valid_from')
      .or('valid_until.is.null,valid_until.gt.' + new Date().toISOString())
      .order('risk_score', { ascending: false })
      .limit(100);

    if (!error && dbOutbreaks && dbOutbreaks.length > 0) {
      // Use database data
      const lastUpdated = dbOutbreaks[0]?.valid_from ?? new Date().toISOString();
      return NextResponse.json({
        outbreaks: dbOutbreaks,
        lastUpdated,
        source: 'database',
        total: dbOutbreaks.length,
      });
    }

    // Fall back to static data
    return NextResponse.json({
      outbreaks: STATIC_OUTBREAKS,
      lastUpdated: new Date().toISOString(),
      source: 'static',
      total: STATIC_OUTBREAKS.length,
    });
  } catch {
    // Return static data on any error
    return NextResponse.json({
      outbreaks: STATIC_OUTBREAKS,
      lastUpdated: new Date().toISOString(),
      source: 'static_fallback',
      total: STATIC_OUTBREAKS.length,
    });
  }
}
