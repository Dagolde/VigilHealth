/**
 * Super Admin — Manage Users
 * GET   /api/superadmin/users  — list all users
 * PATCH /api/superadmin/users  — suspend/unsuspend user
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (user.app_metadata?.role !== 'superadmin') return null;
  return user;
}

export async function GET() {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Use service client — auth.admin requires service role key
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = (data.users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '',
    role: u.app_metadata?.role ?? 'user',
    created_at: u.created_at,
    banned: (u as unknown as Record<string, unknown>).banned_until
      ? new Date(String((u as unknown as Record<string, unknown>).banned_until)) > new Date()
      : false,
  }));

  return NextResponse.json({ users });
}

export async function PATCH(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as { userId?: string; action?: string };
  const { userId, action } = body;

  if (!userId || !['suspend', 'unsuspend'].includes(action ?? '')) {
    return NextResponse.json({ error: 'userId and action (suspend|unsuspend) required' }, { status: 400 });
  }

  if (userId === caller.id) {
    return NextResponse.json({ error: 'Cannot suspend your own account' }, { status: 400 });
  }

  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, {
    ban_duration: action === 'suspend' ? '876000h' : 'none',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: `User ${action}ed successfully` });
}
