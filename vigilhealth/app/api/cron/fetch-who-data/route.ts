/**
 * WHO Data Fetch Cron Job
 * 
 * Vercel cron job endpoint that fetches WHO data every 6 hours.
 * Schedule: 0 (star)(slash)6 (star) (star) (star) (every 6 hours at minute 0)
 * 
 * This endpoint:
 * 1. Fetches data from WHO API
 * 2. Parses and maps to internal format
 * 3. Stores in database
 * 4. Updates cache
 * 5. Falls back to cached data on API failure
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  getCachedWHOData,
  getFallbackWHOData,
  setCachedWHOData,
} from '@/lib/cache/who-cache';
import { fetchWHODataWithRetry } from '@/lib/external/who-api-client';
import { mapWHODataToInternal } from '@/lib/external/who-data-mapper';
import { parseWHOData } from '@/lib/external/who-data-parser';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max execution time

/**
 * Stores WHO data in the database
 * @param data - Internal risk data to store
 * @param supabase - Supabase client
 * @returns Number of records inserted
 */
async function storeWHODataInDatabase(
  data: Array<{
    source: string;
    disease: string;
    locations: Array<{ country: string; lat: number; lng: number }>;
    severity: string;
    caseCount: number;
    timestamp: string;
    sourceUrl: string;
  }>,
  supabase: ReturnType<typeof createServiceClient>
): Promise<number> {
  if (data.length === 0) return 0;

  // Delete existing WHO records from today to avoid duplicates
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  await supabase
    .from('risk_levels')
    .delete()
    .eq('source', 'who')
    .gte('valid_from', todayStart.toISOString());

  // Prepare records for insertion
  const records = data.flatMap((outbreak) =>
    outbreak.locations.map((location) => ({
      location: `POINT(${location.lng} ${location.lat})`,
      location_name: location.country,
      city: null as string | null,
      state: null as string | null,
      country: location.country,
      disease: outbreak.disease,
      risk_level: outbreak.severity as 'low' | 'moderate' | 'high' | 'critical',
      risk_score:
        outbreak.severity === 'critical' ? 90 :
        outbreak.severity === 'high' ? 70 :
        outbreak.severity === 'moderate' ? 50 : 30,
      case_count: outbreak.caseCount,
      source: 'who' as const,
      source_url: outbreak.sourceUrl,
      confidence: 90,
      valid_from: new Date().toISOString(),
      valid_until: null as string | null,
    }))
  );

  if (records.length === 0) return 0;

  // Insert in batches of 50 to avoid payload limits
  const batchSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error, count } = await supabase
      .from('risk_levels')
      .insert(batch, { count: 'exact' });

    if (error) throw new Error(`DB insert error: ${error.message} (code: ${error.code})`);
    totalInserted += count ?? batch.length;
  }

  return totalInserted;
}

/**
 * GET handler for WHO data fetch cron job
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

    // eslint-disable-next-line no-console
    console.log('[WHO Cron] Starting WHO data fetch...');

    // Check if we have valid cached data
    const cachedData = getCachedWHOData();
    if (cachedData) {
      console.log('[WHO Cron] Using cached data (still valid)');
      return NextResponse.json({
        success: true,
        source: 'cache',
        recordCount: cachedData.length,
        message: 'Using cached WHO data (still valid)',
      });
    }

    let internalData;
    let dataSource = 'api';

    try {
      // Fetch data from WHO API with retry
      console.log('[WHO Cron] Fetching from WHO API...');
      const rawData = await fetchWHODataWithRetry(3, 1000);
      console.log(`[WHO Cron] Fetched ${rawData.length} raw records`);

      // Parse WHO data
      const parsedData = parseWHOData(rawData);
      console.log(`[WHO Cron] Parsed ${parsedData.length} valid records`);

      // Map to internal format
      internalData = mapWHODataToInternal(parsedData);
      console.log(`[WHO Cron] Mapped ${internalData.length} records to internal format`);

      // Update cache with fresh data
      setCachedWHOData(internalData);
      console.log('[WHO Cron] Cache updated with fresh data');
    } catch (apiError) {
      console.error('[WHO Cron] API fetch failed:', apiError);

      // Fallback to cached data (even if expired)
      const fallbackData = getFallbackWHOData();
      if (fallbackData) {
        internalData = fallbackData;
        dataSource = 'fallback';
      } else {
        // Use static fallback built into the API client
        internalData = [];
        dataSource = 'static';
        return NextResponse.json({
          success: true,
          source: 'static_fallback',
          recordCount: 0,
          message: 'WHO API unavailable, using static outbreak data',
        });
      }
    }

    // Store in database
    try {
      const supabase = createServiceClient();
      const recordCount = await storeWHODataInDatabase(internalData, supabase);
      console.log(`[WHO Cron] Stored ${recordCount} records in database`);

      return NextResponse.json({
        success: true,
        source: dataSource,
        recordCount: internalData.length,
        storedCount: recordCount,
        message: `Successfully processed WHO data from ${dataSource}`,
      });
    } catch (dbError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to store WHO data in database',
          details: dbError instanceof Error ? dbError.message : JSON.stringify(dbError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[WHO Cron] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error in WHO data fetch',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
