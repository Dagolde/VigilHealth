/**
 * POST /api/community/reports
 *
 * Stores a community health observation report with PostGIS coordinates.
 * Requires authentication. Runs content filter before storing.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { filterContent } from '@/lib/moderation/content-filter';
import { createClient } from '@/lib/supabase/server';

// ─── Validation schema ────────────────────────────────────────────────────────

const ReportSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  observationType: z.enum(['symptom', 'supply', 'other']),
  description: z.string().min(10).max(500),
});

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    // Validate with Zod
    const parseResult = ReportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { lat, lng, observationType, description } = parseResult.data;

    // Run content filter
    const filterResult = filterContent(description);
    if (!filterResult.isAllowed) {
      return NextResponse.json(
        {
          error: 'Content was blocked by the content filter.',
          reason: filterResult.reason,
        },
        { status: 422 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Store report with PostGIS POINT(lng lat) — longitude first per PostGIS convention
    const { data, error } = await supabase
      .from('community_reports')
      .insert({
        user_id: userId,
        location: `POINT(${lng} ${lat})` as unknown,
        observation_type: observationType,
        description,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[POST /api/community/reports] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to store report. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: data.id,
        createdAt: data.created_at,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/community/reports] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
