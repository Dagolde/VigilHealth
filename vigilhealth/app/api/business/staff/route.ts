/**
 * Business Staff API
 *
 * GET  /api/business/staff  – list staff for user's org
 * POST /api/business/staff  – add staff member by user_id
 * DELETE /api/business/staff – remove staff member by id
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
    const { data: staff, error } = await service
      .from('business_users')
      .select('id, user_id, role, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ staff: staff ?? [], orgId });
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

    const body = (await request.json()) as { user_id?: string; role?: 'admin' | 'member' };
    if (!body.user_id?.trim()) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const service = createServiceClient();

    // Check if already a member
    const { data: existing } = await service
      .from('business_users')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', body.user_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 });
    }

    const { error: insertError } = await service.from('business_users').insert({
      organization_id: orgId,
      user_id: body.user_id,
      role: body.role ?? 'member',
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
      return NextResponse.json({ error: 'Staff record id is required' }, { status: 400 });
    }

    const service = createServiceClient();

    // Prevent removing yourself if you're the only admin
    const { data: targetMember } = await service
      .from('business_users')
      .select('user_id, role')
      .eq('id', body.id)
      .eq('organization_id', orgId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (targetMember.user_id === user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });
    }

    const { error: deleteError } = await service
      .from('business_users')
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
