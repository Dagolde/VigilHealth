/**
 * Moderator Approval API
 *
 * POST /api/admin/moderation/approve
 * Approves incorrectly blocked content.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logModerationAction } from '@/lib/moderation/moderation-log';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      contentType?: string;
      contentId?: string;
      userId?: string;
      reason?: string;
    };

    const { contentType, contentId, userId, reason } = body;

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'contentType and contentId are required' },
        { status: 400 }
      );
    }

    const entry = logModerationAction({
      contentType: contentType as 'community_report' | 'answer' | 'question' | 'help_request',
      contentId,
      userId,
      action: 'approved',
      reason: reason ?? 'Approved by moderator',
    });

    return NextResponse.json({
      success: true,
      logId: entry.id,
      message: 'Content approved and restored',
    });
  } catch (error) {
    console.error('[ModerationApprove] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
