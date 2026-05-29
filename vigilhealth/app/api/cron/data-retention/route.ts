/**
 * Data Retention Cron Job
 *
 * Vercel Cron: runs daily to enforce 90-day data retention policy.
 * Deletes employee wellness reports older than 90 days.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RETENTION_DAYS = 90;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const cutoffDate = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1_000
    ).toISOString();

    // Delete old wellness reports
    const { count: wellnessDeleted, error: wellnessError } = await supabase
      .from('employee_wellness_reports')
      .delete({ count: 'exact' })
      .lt('reported_at', cutoffDate);

    if (wellnessError) {
      console.error('[DataRetention] Error deleting wellness reports:', wellnessError);
    }

    // Delete old community reports (also 90 days)
    const { count: communityDeleted, error: communityError } = await supabase
      .from('community_reports')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffDate);

    if (communityError) {
      console.error('[DataRetention] Error deleting community reports:', communityError);
    }

    // Deleted wellness and community reports — return counts in response
    return NextResponse.json({
      success: true,
      cutoffDate,
      deleted: {
        wellnessReports: wellnessDeleted ?? 0,
        communityReports: communityDeleted ?? 0,
      },
    });
  } catch (error) {
    console.error('[DataRetention] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
