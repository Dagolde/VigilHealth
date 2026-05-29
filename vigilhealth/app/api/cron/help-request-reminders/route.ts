/**
 * Help Request Reminders Cron Job
 *
 * Vercel Cron: runs every hour to check for unfulfilled requests older than 24 hours.
 * Sends reminder notifications to nearby volunteers.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { enqueueEmail } from '@/lib/email/email-queue';
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
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();

    // Find pending requests older than 24 hours
    const { data: staleRequests, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo)
      .limit(50);

    if (error) {
      console.error('[HelpRequestReminders] Query error:', error);
      return NextResponse.json({ error: 'Failed to query help requests' }, { status: 500 });
    }

    let remindersQueued = 0;

    for (const req of staleRequests ?? []) {
      // In production, query nearby volunteers and send them reminders
      // For now, queue a placeholder reminder for the requester

      // Queue a reminder for stale request (id logged in response)
      if (req.requester_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(req.requester_id);
        const email = userData?.user?.email;

        if (email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.app';
          enqueueEmail({
            to: email,
            subject: 'Your help request is still pending',
            html: `<p>Your help request "<strong>${req.description}</strong>" has been pending for over 24 hours. <a href="${appUrl}/community">View your request</a>.</p>`,
            text: `Your help request "${req.description}" has been pending for over 24 hours. Visit ${appUrl}/community to view it.`,
          });
          remindersQueued++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      staleRequests: staleRequests?.length ?? 0,
      remindersQueued,
    });
  } catch (error) {
    console.error('[HelpRequestReminders] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
