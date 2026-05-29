/**
 * Super Admin — Manage Business Accounts
 * GET    /api/superadmin/businesses  — list all business organizations
 * PATCH  /api/superadmin/businesses  — update subscription tier
 * DELETE /api/superadmin/businesses  — delete a business organization
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'superadmin') return null;
  return user;
}

export async function GET() {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Use service client to bypass RLS and see all orgs
  const service = createServiceClient();

  const { data: orgs, error: orgsError } = await service
    .from('business_organizations')
    .select('*')
    .order('created_at', { ascending: false });

  if (orgsError) return NextResponse.json({ error: orgsError.message }, { status: 500 });

  const { data: locations } = await service
    .from('business_locations')
    .select('organization_id');

  const { data: members } = await service
    .from('business_users')
    .select('organization_id');

  const locationCounts: Record<string, number> = {};
  const memberCounts: Record<string, number> = {};

  for (const loc of locations ?? []) {
    if (loc.organization_id) locationCounts[loc.organization_id] = (locationCounts[loc.organization_id] ?? 0) + 1;
  }
  for (const mem of members ?? []) {
    if (mem.organization_id) memberCounts[mem.organization_id] = (memberCounts[mem.organization_id] ?? 0) + 1;
  }

  const businesses = (orgs ?? []).map(org => ({
    id: org.id,
    name: org.name,
    subscription_tier: org.subscription_tier ?? 'free',
    subscription_expires_at: org.subscription_expires_at ?? null,
    created_at: org.created_at,
    location_count: locationCounts[org.id] ?? 0,
    member_count: memberCounts[org.id] ?? 0,
  }));

  return NextResponse.json({ businesses });
}

export async function PATCH(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as { id?: string; subscription_tier?: string; subscription_expires_at?: string | null };
  const { id, subscription_tier, subscription_expires_at } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (subscription_tier && !['free', 'basic', 'premium'].includes(subscription_tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (subscription_tier) updates.subscription_tier = subscription_tier;
  if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at;

  const service = createServiceClient();
  const { error } = await service.from('business_organizations').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: 'Business updated successfully' });
}

export async function DELETE(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as { id?: string };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const service = createServiceClient();
  const { error } = await service.from('business_organizations').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: 'Business deleted successfully' });
}
