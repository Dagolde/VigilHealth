/**
 * Safe Badge Approval API
 *
 * POST /api/admin/safe-badges/[id]/approve
 * Approves or rejects a Safe Badge application.
 * Approved badges have 30-day validity.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const BADGE_VALIDITY_DAYS = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, verify admin role here

    const locationId = params.id;
    const body = await request.json().catch(() => ({})) as { action?: string };
    const action = body.action ?? 'approve';

    if (action === 'approve') {
      const expiresAt = new Date(
        Date.now() + BADGE_VALIDITY_DAYS * 24 * 60 * 60 * 1_000
      ).toISOString();

      const { error: updateError } = await supabase
        .from('supply_locations')
        .update({
          has_safe_badge: true,
          safe_badge_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', locationId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to approve badge' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'approved',
        expiresAt,
        message: `Safe Badge approved. Valid for ${BADGE_VALIDITY_DAYS} days.`,
      });
    } else if (action === 'reject') {
      return NextResponse.json({
        success: true,
        action: 'rejected',
        message: 'Safe Badge application rejected.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[SafeBadgeApprove] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
