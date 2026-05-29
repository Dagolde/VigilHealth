/**
 * Telehealth Provider Availability API
 * 
 * GET /api/telehealth/availability
 * Returns availability and wait times for all active telehealth providers
 */

import { NextResponse } from 'next/server';

import { fetchAllProviderAvailability } from '@/lib/telehealth/api-client';

export const runtime = 'edge';

export async function GET() {
  try {
    const availability = await fetchAllProviderAvailability();

    // Filter out unavailable providers
    const availableProviders = availability.filter((p) => p.isAvailable);

    return NextResponse.json(
      {
        providers: availableProviders,
        count: availableProviders.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache
        },
      }
    );
  } catch (error) {
    console.error('Error fetching provider availability:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch provider availability',
        providers: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
