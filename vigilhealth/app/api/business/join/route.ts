/**
 * Business Join API
 *
 * GET  /api/business/join?org=ORG_ID  – get org info for join page
 * POST /api/business/join              – join organization
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: org, error } = await service
      .from('business_organizations')
      .select('id, name')
      .eq('id', orgId)
      .single();

    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ org });
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

    const body = (await request.json()) as { orgId?: string };
    if (!body.orgId?.trim()) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const service = createServiceClient();

    // Check if org exists
    const { data: org } = await service
      .from('business_organizations')
      .select('id')
      .eq('id', body.orgId)
      .single();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if already a member
    const { data: existing } = await service
      .from('business_users')
      .select('id')
      .eq('organization_id', body.orgId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You are already a member of this organization' }, { status: 409 });
    }

    // Add user as member
    const { error: insertError } = await service.from('business_users').insert({
      organization_id: body.orgId,
      user_id: user.id,
      role: 'member',
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
