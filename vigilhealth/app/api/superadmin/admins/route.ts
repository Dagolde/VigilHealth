/**
 * Super Admin — Manage Admin Roles
 * GET  /api/superadmin/admins  — list all admins
 * POST /api/superadmin/admins  — promote user to admin/superadmin
 * DELETE /api/superadmin/admins — revoke admin role
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
  const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const admins = (data.users ?? [])
    .filter(u => u.app_metadata?.role === 'admin' || u.app_metadata?.role === 'superadmin')
    .map(u => ({ id: u.id, email: u.email ?? '', role: u.app_metadata?.role ?? 'user', created_at: u.created_at }));

  return NextResponse.json({ admins });
}

export async function POST(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as { email?: string; role?: string };
  const { email, role } = body;

  if (!email || !['admin', 'superadmin'].includes(role ?? '')) {
    return NextResponse.json({ error: 'email and role (admin|superadmin) required' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: listData, error: listError } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const target = listData.users.find(u => u.email === email);
  if (!target) return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });

  const { error: updateError } = await service.auth.admin.updateUserById(target.id, {
    app_metadata: { ...target.app_metadata, role },
  });

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ message: `${email} promoted to ${role}` });
}

export async function DELETE(request: NextRequest) {
  const caller = await requireSuperAdmin();
  if (!caller) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json() as { userId?: string };
  if (!body.userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
  if (body.userId === caller.id) return NextResponse.json({ error: 'Cannot revoke your own superadmin role' }, { status: 400 });

  const service = createServiceClient();
  const { data: userData, error: fetchError } = await service.auth.admin.getUserById(body.userId);
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const { error } = await service.auth.admin.updateUserById(body.userId, {
    app_metadata: { ...userData.user.app_metadata, role: 'user' },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Admin role revoked' });
}
