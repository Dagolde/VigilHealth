/**
 * Accept Help Request API
 *
 * POST /api/community/help-requests/[id]/accept
 * Allows a volunteer to accept a pending help request.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

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

    const requestId = params.id;

    // Fetch the help request
    const { data: helpRequest, error: fetchError } = await supabase
      .from('help_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !helpRequest) {
      return NextResponse.json({ error: 'Help request not found' }, { status: 404 });
    }

    if (helpRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been accepted or fulfilled' },
        { status: 409 }
      );
    }

    if (helpRequest.requester_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot accept your own help request' },
        { status: 400 }
      );
    }

    // Accept the request
    const { data: updated, error: updateError } = await supabase
      .from('help_requests')
      .update({
        volunteer_id: user.id,
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'pending') // Optimistic lock
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: 'Failed to accept request — it may have been accepted by another volunteer' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Help request accepted',
      requestId,
      volunteerId: user.id,
    });
  } catch (error) {
    console.error('[HelpRequest Accept] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
