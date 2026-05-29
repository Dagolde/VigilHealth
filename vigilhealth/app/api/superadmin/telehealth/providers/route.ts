/**
 * Super Admin — Telehealth Provider Management
 * GET    — list all providers
 * POST   — add new provider
 * PATCH  — update provider (suspend/activate/edit)
 * DELETE — delete provider
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

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('telehealth_provider_catalog')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ providers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as {
    name?: string;
    specialty?: string;
    description?: string;
    website?: string;
    wait_time?: number;
    commission_rate?: number;
    languages?: string[];
    available_24h?: boolean;
  };

  if (!body.name?.trim() || !body.specialty?.trim() || !body.website?.trim()) {
    return NextResponse.json({ error: 'name, specialty, and website are required' }, { status: 400 });
  }

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('telehealth_provider_catalog')
    .insert({
      name: body.name.trim(),
      specialty: body.specialty.trim(),
      description: body.description?.trim() ?? '',
      website: body.website.trim(),
      wait_time: body.wait_time ?? 10,
      commission_rate: body.commission_rate ?? 25,
      languages: body.languages ?? ['English'],
      available_24h: body.available_24h ?? true,
      is_active: true,
      is_suspended: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ provider: data });
}

export async function PATCH(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as {
    id?: string;
    is_active?: boolean;
    is_suspended?: boolean;
    name?: string;
    specialty?: string;
    description?: string;
    website?: string;
    wait_time?: number;
    commission_rate?: number;
    languages?: string[];
    available_24h?: boolean;
  };

  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.is_suspended !== undefined) updates.is_suspended = body.is_suspended;
  if (body.name) updates.name = body.name.trim();
  if (body.specialty) updates.specialty = body.specialty.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.website) updates.website = body.website.trim();
  if (body.wait_time !== undefined) updates.wait_time = body.wait_time;
  if (body.commission_rate !== undefined) updates.commission_rate = body.commission_rate;
  if (body.languages) updates.languages = body.languages;
  if (body.available_24h !== undefined) updates.available_24h = body.available_24h;

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from('telehealth_provider_catalog')
    .update(updates)
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Provider updated' });
}

export async function DELETE(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as { id?: string };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from('telehealth_provider_catalog')
    .delete()
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Provider deleted' });
}
