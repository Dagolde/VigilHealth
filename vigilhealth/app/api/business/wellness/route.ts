/**
 * Business Wellness API
 *
 * GET  /api/business/wellness  – get wellness summary for user's org
 * POST /api/business/wellness  – submit wellness report (anonymous employee_id)
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

    // Get reports from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: reports, error } = await service
      .from('employee_wellness_reports')
      .select('id, symptoms, severity, is_absent, reported_at')
      .eq('organization_id', orgId)
      .gte('reported_at', sevenDaysAgo.toISOString());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allReports = reports ?? [];

    // Get reports from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentReports = allReports.filter((r) => new Date(r.reported_at) >= today);

    // Count absences today
    const absentToday = recentReports.filter((r) => r.is_absent).length;

    // Top symptoms
    const symptomCounts: Record<string, number> = {};
    allReports.forEach((r) => {
      (r.symptoms ?? []).forEach((s) => {
        symptomCounts[s] = (symptomCounts[s] ?? 0) + 1;
      });
    });

    const topSymptoms = Object.entries(symptomCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom]) => symptom);

    return NextResponse.json({
      totalReports: allReports.length,
      recentReports: recentReports.length,
      absentToday,
      topSymptoms,
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
      symptoms?: string[];
      severity?: 'mild' | 'moderate' | 'severe';
      isAbsent?: boolean;
      consent?: boolean;
    };

    if (!body.consent) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    }

    if (!body.symptoms || body.symptoms.length === 0) {
      return NextResponse.json({ error: 'At least one symptom is required' }, { status: 400 });
    }

    if (!body.severity) {
      return NextResponse.json({ error: 'Severity is required' }, { status: 400 });
    }

    const service = createServiceClient();

    // Generate anonymous employee_id (UUID)
    const anonymousEmployeeId = crypto.randomUUID();

    const { error: insertError } = await service.from('employee_wellness_reports').insert({
      organization_id: orgId,
      location_id: null,
      employee_id: anonymousEmployeeId,
      symptoms: body.symptoms,
      severity: body.severity,
      is_absent: body.isAbsent ?? false,
      reported_at: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Wellness report submitted anonymously' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 },
    );
  }
}
