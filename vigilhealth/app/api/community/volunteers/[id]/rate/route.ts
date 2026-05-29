/**
 * Volunteer Rating API
 *
 * POST /api/community/volunteers/[id]/rate
 * Submit a rating for a volunteer after task completion.
 * Flags account on ratings below 3 stars.
 * Auto-suspends on multiple flags.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const FLAG_THRESHOLD = 3; // Number of flags before auto-suspend

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

    const volunteerId = params.id;
    const body = await request.json() as { rating?: number; comment?: string; requestId?: string };

    const { rating, requestId } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    // Fetch current volunteer record
    const { data: volunteer, error: fetchError } = await supabase
      .from('volunteers')
      .select('*')
      .eq('id', volunteerId)
      .single();

    if (fetchError || !volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    if (volunteer.is_suspended) {
      return NextResponse.json({ error: 'This volunteer account is suspended' }, { status: 400 });
    }

    // Calculate new average rating
    const currentAvg = volunteer.average_rating ?? 0;
    const currentCount = volunteer.completed_tasks ?? 0;
    const newAvg =
      currentCount > 0
        ? (currentAvg * currentCount + rating) / (currentCount + 1)
        : rating;

    // Flag account if rating is below 3 stars
    const shouldFlag = rating < 3;
    const newFlagCount = shouldFlag ? (volunteer.flag_count ?? 0) + 1 : (volunteer.flag_count ?? 0);
    const shouldSuspend = newFlagCount >= FLAG_THRESHOLD;

    // Update volunteer record
    const { error: updateError } = await supabase
      .from('volunteers')
      .update({
        average_rating: Math.round(newAvg * 100) / 100,
        completed_tasks: currentCount + 1,
        flag_count: newFlagCount,
        is_suspended: shouldSuspend,
        updated_at: new Date().toISOString(),
      })
      .eq('id', volunteerId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update volunteer rating' }, { status: 500 });
    }

    // Mark help request as fulfilled if requestId provided
    if (requestId) {
      await supabase
        .from('help_requests')
        .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
        .eq('id', requestId);
    }

    return NextResponse.json({
      success: true,
      newAverageRating: Math.round(newAvg * 100) / 100,
      flagged: shouldFlag,
      suspended: shouldSuspend,
      message: shouldSuspend
        ? 'Volunteer account has been suspended pending review'
        : shouldFlag
          ? 'Rating submitted. Volunteer account has been flagged for review.'
          : 'Rating submitted successfully',
    });
  } catch (error) {
    console.error('[VolunteerRate] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
