/**
 * Answer Upvote API
 *
 * POST /api/qa/answers/[id]/upvote
 * Increments the upvote count for an answer.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

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

    // Fetch current upvote count
    const { data: answer, error: fetchError } = await supabase
      .from('answers')
      .select('id, upvotes, is_flagged')
      .eq('id', answerId)
      .single();

    if (fetchError || !answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    if (answer.is_flagged) {
      return NextResponse.json(
        { error: 'Cannot upvote a flagged answer' },
        { status: 400 }
      );
    }

    const newUpvotes = (answer.upvotes ?? 0) + 1;

    const { error: updateError } = await supabase
      .from('answers')
      .update({ upvotes: newUpvotes })
      .eq('id', answerId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to upvote answer' }, { status: 500 });
    }

    return NextResponse.json({ success: true, upvotes: newUpvotes });
  } catch (error) {
    console.error('[AnswerUpvote] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
