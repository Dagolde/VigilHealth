/**
 * Answer Flag API
 *
 * POST /api/qa/answers/[id]/flag
 * Flags an answer as potentially inaccurate.
 * Auto-hides answers with 3+ flags.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const AUTO_HIDE_THRESHOLD = 3;

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const answerId = params.id;

    const { data: answer, error: fetchError } = await supabase
      .from('answers')
      .select('id, flag_count, is_flagged, user_id')
      .eq('id', answerId)
      .single();

    if (fetchError || !answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    if (answer.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot flag your own answer' }, { status: 400 });
    }

    const newFlagCount = (answer.flag_count ?? 0) + 1;
    const shouldHide = newFlagCount >= AUTO_HIDE_THRESHOLD;

    const { error: updateError } = await supabase
      .from('answers')
      .update({
        flag_count: newFlagCount,
        is_flagged: shouldHide,
        updated_at: new Date().toISOString(),
      })
      .eq('id', answerId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to flag answer' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      flagCount: newFlagCount,
      hidden: shouldHide,
      message: shouldHide
        ? 'Answer has been hidden pending moderator review'
        : 'Answer flagged for review',
    });
  } catch (error) {
    console.error('[AnswerFlag] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
