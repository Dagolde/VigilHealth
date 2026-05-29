/**
 * Safe Badge Re-verification Cron Job
 *
 * Vercel Cron: runs daily to check for expired Safe Badges and remove them.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    // Find locations with expired Safe Badges
    const { data: expiredLocations, error: fetchError } = await supabase
      .from('supply_locations')
      .select('id, name, safe_badge_expires_at')
      .eq('has_safe_badge', true)
      .lt('safe_badge_expires_at', now);

    if (fetchError) {
      console.error('[ReverifyBadges] Query error:', fetchError);
      return NextResponse.json({ error: 'Failed to query locations' }, { status: 500 });
    }

    if (!expiredLocations || expiredLocations.length === 0) {
      return NextResponse.json({ success: true, removed: 0, message: 'No expired badges found' });
    }

    const expiredIds = expiredLocations.map((l) => l.id);

    // Remove expired badges
    const { error: updateError } = await supabase
      .from('supply_locations')
      .update({
        has_safe_badge: false,
        safe_badge_expires_at: null,
        updated_at: now,
      })
      .in('id', expiredIds);

    if (updateError) {
      console.error('[ReverifyBadges] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to remove expired badges' }, { status: 500 });
    }

    // Expired badges removed — return count in response
    return NextResponse.json({
      success: true,
      removed: expiredLocations.length,
      locations: expiredLocations.map((l) => ({ id: l.id, name: l.name })),
    });
  } catch (error) {
    console.error('[ReverifyBadges] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
