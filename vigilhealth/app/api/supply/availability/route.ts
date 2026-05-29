/**
 * POST /api/supply/availability
 *
 * Stores a crowdsourced availability report for a supply location.
 * Requires authentication. Inserts into `supply_availability` table.
 *
 * Request body:
 *   locationId  - UUID of the supply location
 *   itemName    - name of the item being reported
 *   status      - 'in_stock' | 'low_stock' | 'out_of_stock'
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

// ─── Validation schema ────────────────────────────────────────────────────────

const AvailabilityReportSchema = z.object({
  locationId: z.string().uuid('locationId must be a valid UUID'),
  itemName: z.string().min(1, 'itemName is required').max(200, 'itemName must be 200 chars or fewer'),
  status: z.enum(['in_stock', 'low_stock', 'out_of_stock']),
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
    const parseResult = AvailabilityReportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { locationId, itemName, status } = parseResult.data;

    // Check authentication
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify the supply location exists
    const { data: location, error: locationError } = await supabase
      .from('supply_locations')
      .select('id')
      .eq('id', locationId)
      .single();

    if (locationError || !location) {
      return NextResponse.json({ error: 'Supply location not found.' }, { status: 404 });
    }

    // Insert availability report
    const { data, error } = await supabase
      .from('supply_availability')
      .insert({
        location_id: locationId,
        item_name: itemName.trim(),
        status,
        reported_by: userId,
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[POST /api/supply/availability] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to store availability report. Please try again.' },
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
    console.error('[POST /api/supply/availability] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
