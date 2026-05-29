/**
 * Business Safe Badge API
 *
 * GET  /api/business/safe-badge  – check current badge status for user's org
 * POST /api/business/safe-badge  – submit badge application
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

    // Get the org's locations and check safe badge status
    const { data: locations, error } = await service
      .from('business_locations')
      .select('id, name, address')
      .eq('organization_id', orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check supply_locations for safe badge status linked to this org's locations
    const locationIds = (locations ?? []).map((l) => l.id);
    let badgeStatus: 'active' | 'expired' | 'not_applied' = 'not_applied';
    let badgeExpiresAt: string | null = null;
    const contactPerson: string | null = null;
    let contactPhone: string | null = null;
    const safetyProtocols: string | null = null;

    if (locationIds.length > 0) {
      const { data: supplyLocs } = await service
        .from('supply_locations')
        .select('has_safe_badge, safe_badge_expires_at, phone')
        .in('id', locationIds)
        .eq('has_safe_badge', true)
        .limit(1)
        .single();

      if (supplyLocs) {
        const now = new Date();
        const expiresAt = supplyLocs.safe_badge_expires_at
          ? new Date(supplyLocs.safe_badge_expires_at)
          : null;

        if (expiresAt && expiresAt > now) {
          badgeStatus = 'active';
        } else if (expiresAt) {
          badgeStatus = 'expired';
        }

        badgeExpiresAt = supplyLocs.safe_badge_expires_at;
        contactPhone = supplyLocs.phone;
      }
    }

    return NextResponse.json({
      status: badgeStatus,
      expiresAt: badgeExpiresAt,
      contactPerson,
      contactPhone,
      safetyProtocols,
      orgId,
      locations: locations ?? [],
    });
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

    const body = (await request.json()) as {
      safetyProtocols?: string;
      contactPerson?: string;
      contactPhone?: string;
    };

    if (!body.safetyProtocols?.trim() || body.safetyProtocols.trim().length < 50) {
      return NextResponse.json(
        { error: 'Safety protocols description must be at least 50 characters' },
        { status: 400 },
      );
    }

    if (!body.contactPerson?.trim()) {
      return NextResponse.json({ error: 'Contact person is required' }, { status: 400 });
    }

    if (!body.contactPhone?.trim()) {
      return NextResponse.json({ error: 'Contact phone is required' }, { status: 400 });
    }

    const service = createServiceClient();

    // Set badge expiry 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Update all supply_locations linked to this org's business_locations
    const { data: bizLocations } = await service
      .from('business_locations')
      .select('id')
      .eq('organization_id', orgId);

    const locationIds = (bizLocations ?? []).map((l) => l.id);

    if (locationIds.length > 0) {
      await service
        .from('supply_locations')
        .update({
          has_safe_badge: true,
          safe_badge_expires_at: expiresAt.toISOString(),
          phone: body.contactPhone.trim(),
        })
        .in('id', locationIds);
    }

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
      message: 'Safe Badge application submitted. Badge is now active for 30 days.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
