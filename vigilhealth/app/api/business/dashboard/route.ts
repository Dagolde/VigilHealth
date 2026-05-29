/**
 * Business Dashboard Data API
 * GET /api/business/dashboard
 * Returns org data and wellness summary for the authenticated user's business.
 * Uses service client to bypass RLS on business tables.
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceClient();

    // Find user's organization membership
    const { data: membership } = await service
      .from('business_users')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!membership?.organization_id) {
      return NextResponse.json({ noOrg: true });
    }

    // Fetch org details
    const { data: org } = await service
      .from('business_organizations')
      .select('id, name, subscription_tier, subscription_expires_at')
      .eq('id', membership.organization_id)
      .single();

    if (!org) return NextResponse.json({ noOrg: true });

    // Fetch wellness summary (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const { data: reports } = await service
      .from('employee_wellness_reports')
      .select('symptoms, is_absent, reported_at')
      .eq('organization_id', org.id)
      .gte('reported_at', sevenDaysAgo);

    const allReports = reports ?? [];
    const todayReports = allReports.filter(r => new Date(r.reported_at) >= today);
    const absentToday = todayReports.filter(r => r.is_absent).length;

    const symptomCounts: Record<string, number> = {};
    for (const r of allReports) {
      for (const s of (r.symptoms ?? [])) {
        symptomCounts[s] = (symptomCounts[s] ?? 0) + 1;
      }
    }
    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s]) => s);

    return NextResponse.json({
      org,
      wellness: {
        totalReports: allReports.length,
        recentReports: todayReports.length,
        absentToday,
        topSymptoms,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
