/**
 * Daily Digest Cron Job
 *
 * Vercel Cron: 0 7 * * * (7 AM UTC daily)
 * Sends daily health digest emails to all subscribed users.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { generateDigestForUser } from '@/lib/email/digest-generator';
import { enqueueEmail, processQueue } from '@/lib/email/email-queue';
import { canSendEmail, recordEmailSent } from '@/lib/email/rate-limiter';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized invocations
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Fetch users who have email digest enabled
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, primary_city, primary_state, notification_preferences')
      .limit(500);

    if (error) {
      console.error('[DigestCron] Failed to fetch user profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    let queued = 0;
    let skipped = 0;

    for (const profile of profiles ?? []) {
      // Check notification preferences
      const prefs = profile.notification_preferences as {
        email?: boolean;
        digest?: boolean;
      } | null;

      if (prefs?.email === false || prefs?.digest === false) {
        skipped++;
        continue;
      }

      if (!canSendEmail()) {
        console.warn('[DigestCron] Daily email limit reached, stopping digest send');
        break;
      }

      // Get user email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
      const email = userData?.user?.email;
      if (!email) {
        skipped++;
        continue;
      }

      const location =
        [profile.primary_city, profile.primary_state].filter(Boolean).join(', ') || 'Your area';

      const digest = await generateDigestForUser({
        userId: profile.id,
        email,
        userName: profile.full_name ?? 'VigilHealth User',
        location,
        city: profile.primary_city,
        state: profile.primary_state,
        unsubscribeToken: Buffer.from(profile.id).toString('base64'),
      });

      if (!digest) {
        skipped++;
        continue;
      }

      enqueueEmail({
        to: email,
        subject: digest.subject,
        html: digest.html,
        text: digest.text,
      });

      recordEmailSent();
      queued++;
    }

    // Process the queue
    const result = await processQueue();

    return NextResponse.json({
      success: true,
      queued,
      skipped,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error('[DigestCron] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
