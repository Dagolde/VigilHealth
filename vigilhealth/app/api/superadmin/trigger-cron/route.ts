/**
 * Super Admin — Trigger Cron Job
 * POST /api/superadmin/trigger-cron
 * Proxies cron job calls server-side with the CRON_SECRET header.
 * Only accessible by superadmins.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Verify superadmin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json() as { path?: string };
  const { path } = body;

  if (!path || !path.startsWith('/api/cron/')) {
    return NextResponse.json({ error: 'Invalid cron path' }, { status: 400 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const cronUrl = `${appUrl}${path}`;

  try {
    const res = await fetch(cronUrl, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to call cron: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
