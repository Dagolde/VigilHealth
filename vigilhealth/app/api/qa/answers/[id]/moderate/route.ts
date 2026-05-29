/**
 * Answer Moderation API
 *
 * POST /api/qa/answers/[id]/moderate
 * Approve or remove a flagged answer.
 * Tracks misinformation count per user.
 * Auto-suspends posting privileges after 3 confirmed misinformation posts.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const MISINFORMATION_SUSPEND_THRESHOLD = 3;

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

    // In production, verify the user has moderator role
    // For now, any authenticated user can moderate (restrict in production)

    const answerId = params.id;
    const body = await request.json() as { action?: string };
    const { action } = body;

    if (action !== 'approve' && action !== 'remove') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "remove"' },
        { status: 400 }
      );
    }

    const { data: answer, error: fetchError } = await supabase
      .from('answers')
      .select('id, user_id, is_flagged')
      .eq('id', answerId)
      .single();

    if (fetchError || !answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Clear flags and restore visibility
      const { error: updateError } = await supabase
        .from('answers')
        .update({
          is_flagged: false,
          flag_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', answerId);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to approve answer' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'approved' });
    }

    // action === 'remove': delete the answer and track misinformation
    const { error: deleteError } = await supabase
      .from('answers')
      .delete()
      .eq('id', answerId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to remove answer' }, { status: 500 });
    }

    // Track misinformation count for the answer author
    if (answer.user_id) {
      // Use volunteers table flag_count as a proxy for misinformation tracking
      // In production, add a dedicated misinformation_count column to user_profiles
      const { data: volunteer } = await supabase
        .from('volunteers')
        .select('flag_count, is_suspended')
        .eq('id', answer.user_id)
        .single();

      if (volunteer) {
        const newCount = (volunteer.flag_count ?? 0) + 1;
        const shouldSuspend = newCount >= MISINFORMATION_SUSPEND_THRESHOLD;

        await supabase
          .from('volunteers')
          .update({
            flag_count: newCount,
            is_suspended: shouldSuspend || volunteer.is_suspended,
          })
          .eq('id', answer.user_id);

        return NextResponse.json({
          success: true,
          action: 'removed',
          misinformationCount: newCount,
          postingPrivilegesSuspended: shouldSuspend,
        });
      }
    }

    return NextResponse.json({ success: true, action: 'removed' });
  } catch (error) {
    console.error('[AnswerModerate] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
