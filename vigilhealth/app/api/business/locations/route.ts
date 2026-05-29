/**
 * Business Locations API
 *
 * GET    /api/business/locations  – list locations for user's org
 * POST   /api/business/locations  – add new location
 * DELETE /api/business/locations  – remove location
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

async function getOrgId(userId: string): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service
    .from('business_users')
    .select('organization_id')
    .eq('user_id', userId)
    .single();
  return data?.organization_id ?? null;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await getOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const service = createServiceClient();
    const { data: locations, error } = await service
      .from('business_locations')
      .select('id, name, address, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get employee counts per location
    const locationIds = (locations ?? []).map((l) => l.id);
    const employeeCounts: Record<string, number> = {};

    if (locationIds.length > 0) {
      const { data: reports } = await service
        .from('employee_wellness_reports')
        .select('location_id')
        .in('location_id', locationIds);

      (reports ?? []).forEach((r) => {
        if (r.location_id) {
          employeeCounts[r.location_id] = (employeeCounts[r.location_id] ?? 0) + 1;
        }
      });
    }

    const locationsWithCounts = (locations ?? []).map((l) => ({
      ...l,
      employeeCount: employeeCounts[l.id] ?? 0,
    }));

    return NextResponse.json({ locations: locationsWithCounts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await getOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = (await request.json()) as { name?: string; address?: string };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: newLocation, error: insertError } = await service
      .from('business_locations')
      .insert({
        organization_id: orgId,
        name: body.name.trim(),
        address: body.address?.trim() ?? null,
      })
      .select('id, name, address, created_at')
      .single();

    if (insertError || !newLocation) {
      return NextResponse.json(
        { error: insertError?.message ?? 'Failed to create location' },
        { status: 500 },
      );
    }

    return NextResponse.json({ location: { ...newLocation, employeeCount: 0 } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await getOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = (await request.json()) as { id?: string };
    if (!body.id?.trim()) {
      return NextResponse.json({ error: 'Location id is required' }, { status: 400 });
    }

    const service = createServiceClient();
    const { error: deleteError } = await service
      .from('business_locations')
      .delete()
      .eq('id', body.id)
      .eq('organization_id', orgId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
