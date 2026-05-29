/**
 * CDC NNDSS Data Fetch Cron Job
 * 
 * Vercel cron job endpoint that fetches CDC NNDSS data daily at 2 AM.
 * Schedule: 0 2 * * * (daily at 2 AM UTC)
 * 
 * This endpoint:
 * 1. Fetches data from CDC NNDSS API (Socrata)
 * 2. Parses and maps to internal format
 * 3. Stores in database with CDC-over-WHO priority for US locations
 * 4. Updates cache
 * 5. Falls back to cached data on API failure
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  getCachedCDCData,
  getFallbackCDCData,
  setCachedCDCData,
} from '@/lib/cache/cdc-cache';
import { fetchCDCDataWithRetry } from '@/lib/external/cdc-api-client';
import { mapCDCDataToInternal } from '@/lib/external/cdc-data-mapper';
import { parseCDCData } from '@/lib/external/cdc-data-parser';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max execution time

/**
 * Stores CDC data in the database
 * Implements CDC-over-WHO priority: CDC data replaces WHO data for US locations
 * @param data - Internal risk data to store
 * @param supabase - Supabase client
 * @returns Number of records inserted
 */
async function storeCDCDataInDatabase(
  data: Array<{
    source: string;
    disease: string;
    locations: Array<{
      state: string;
      county: string;
      fipsCode: string;
      lat: number;
      lng: number;
    }>;
    severity: string;
    caseCount: number;
    timestamp: string;
    sourceUrl: string;
  }>,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  if (data.length === 0) {
    return 0;
  }

  // Prepare records for insertion
  const records = data.flatMap((outbreak) =>
    outbreak.locations.map((location) => ({
      location: `POINT(${location.lng} ${location.lat})`,
      location_name: `${location.county}, ${location.state}`,
      city: null as string | null,
      state: location.state,
      country: 'United States',
      disease: outbreak.disease,
      risk_level: outbreak.severity as 'low' | 'moderate' | 'high' | 'critical',
      risk_score: outbreak.severity === 'critical' ? 90 : outbreak.severity === 'high' ? 70 : outbreak.severity === 'moderate' ? 50 : 30,
      case_count: outbreak.caseCount,
      source: 'cdc' as const,
      source_url: outbreak.sourceUrl,
      confidence: 95, // CDC data is highly reliable (higher than WHO for US)
      valid_from: outbreak.timestamp,
      valid_until: null as string | null, // No expiration
    }))
  );

  // Insert records (upsert to avoid duplicates)
  // CDC data takes priority over WHO data for US locations
  const { error, count } = await supabase
    .from('risk_levels')
    .upsert(records, {
      onConflict: 'disease,location_name,source,valid_from',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Error storing CDC data in database:', error);
    throw error;
  }

  return count || records.length;
}

/**
 * GET handler for CDC data fetch cron job
 */
/* eslint-disable no-console */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sets this header for cron jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CDC Cron] Starting CDC NNDSS data fetch...');

    // Check if we have valid cached data
    const cachedData = getCachedCDCData();
    if (cachedData) {
      console.log('[CDC Cron] Using cached data (still valid)');
      return NextResponse.json({
        success: true,
        source: 'cache',
        recordCount: cachedData.length,
        message: 'Using cached CDC data (still valid)',
      });
    }

    let internalData;
    let dataSource = 'api';

    try {
      // Fetch data from CDC NNDSS API with retry
      console.log('[CDC Cron] Fetching from CDC NNDSS API...');
      const rawData = await fetchCDCDataWithRetry(3, 2000);
      console.log(`[CDC Cron] Fetched ${rawData.length} raw records`);

      // Parse CDC data
      const parsedData = parseCDCData(rawData);
      console.log(`[CDC Cron] Parsed ${parsedData.length} valid records`);

      // Map to internal format (includes FIPS geocoding)
      internalData = mapCDCDataToInternal(parsedData);
      console.log(`[CDC Cron] Mapped ${internalData.length} records to internal format`);

      // Update cache with fresh data
      setCachedCDCData(internalData);
      console.log('[CDC Cron] Cache updated with fresh data');
    } catch (apiError) {
      console.error('[CDC Cron] API fetch failed:', apiError);

      // Fallback to cached data (even if expired)
      const fallbackData = getFallbackCDCData();
      if (fallbackData) {
        console.log('[CDC Cron] Using fallback cached data');
        internalData = fallbackData;
        dataSource = 'fallback';
      } else {
        console.error('[CDC Cron] No fallback data available');
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch CDC data and no fallback available',
            details: apiError instanceof Error ? apiError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Store in database
    try {
      const supabase = await createClient();
      const recordCount = await storeCDCDataInDatabase(internalData, supabase);
      console.log(`[CDC Cron] Stored ${recordCount} records in database`);

      return NextResponse.json({
        success: true,
        source: dataSource,
        recordCount: internalData.length,
        storedCount: recordCount,
        message: `Successfully processed CDC data from ${dataSource}`,
      });
    } catch (dbError) {
      console.error('[CDC Cron] Database storage failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to store CDC data in database',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[CDC Cron] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error in CDC data fetch',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
