/**
 * Super Admin — Telehealth Management
 * GET   /api/superadmin/telehealth  — list all referrals + stats
 * PATCH /api/superadmin/telehealth  — update referral (mark commission paid)
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
  const { data: referrals, error } = await service
    .from('telehealth_referrals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = referrals ?? [];
  const stats = {
    total: all.length,
    completed: all.filter(r => r.status === 'completed').length,
    pending: all.filter(r => r.status === 'pending').length,
    totalCommission: all.reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0),
    earnedCommission: all.filter(r => r.status === 'completed').reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0),
  };

  return NextResponse.json({ referrals: all, stats });
}

export async function PATCH(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as { id?: string; commission_paid?: boolean; status?: string };
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.commission_paid !== undefined) updates.commission_paid = body.commission_paid;
  if (body.status) updates.status = body.status;

  const service = createServiceClient();
  const { error } = await service.from('telehealth_referrals').update(updates).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: 'Updated successfully' });
}
