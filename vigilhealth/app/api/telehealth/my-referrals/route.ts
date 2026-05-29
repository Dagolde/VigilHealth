/**
 * GET /api/telehealth/my-referrals
 * Returns the authenticated user's telehealth referral history.
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ referrals: [] });

    const service = createServiceClient();
    const { data: referrals } = await service
      .from('telehealth_referrals')
      .select('id, provider_id, provider_name, referral_code, status, created_at, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ referrals: referrals ?? [] });
  } catch {
    return NextResponse.json({ referrals: [] });
  }
}
