/**
 * Telehealth Commission Report API
 * 
 * GET /api/telehealth/commission-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns commission summary for a date range
 * 
 * This endpoint is for internal use to track affiliate commissions
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getCommissionSummary } from '@/lib/telehealth/referral-tracking';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Get date range from query params
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Default to current month if not provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultEndDate = now.toISOString();

    const start = startDate || defaultStartDate;
    const end = endDate || defaultEndDate;

    // Fetch commission summary
    const summary = await getCommissionSummary(start, end);

    if (!summary) {
      return NextResponse.json(
        {
          error: 'Failed to fetch commission summary',
        },
        { status: 500 }
      );
    }

    // Calculate totals
    type ProviderSummary = {
      providerName: string;
      totalReferrals: number;
      completedReferrals: number;
      pendingReferrals: number;
      totalCommission: number;
      earnedCommission: number;
    };
    type Totals = Omit<ProviderSummary, 'providerName'>;
    const totals = Object.values(summary as Record<string, ProviderSummary>).reduce(
      (acc: Totals, provider: ProviderSummary) => {
        acc.totalReferrals += provider.totalReferrals;
        acc.completedReferrals += provider.completedReferrals;
        acc.pendingReferrals += provider.pendingReferrals;
        acc.totalCommission += provider.totalCommission;
        acc.earnedCommission += provider.earnedCommission;
        return acc;
      },
      {
        totalReferrals: 0,
        completedReferrals: 0,
        pendingReferrals: 0,
        totalCommission: 0,
        earnedCommission: 0,
      }
    );

    return NextResponse.json(
      {
        dateRange: {
          start,
          end,
        },
        byProvider: summary,
        totals,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache', // Don't cache commission data
        },
      }
    );
  } catch (error) {
    console.error('Error fetching commission report:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
