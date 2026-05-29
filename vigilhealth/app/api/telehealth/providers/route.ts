/**
 * GET /api/telehealth/providers
 * Returns active (non-suspended) telehealth providers from the database.
 * Falls back to static list if DB table doesn't exist yet.
 */

import { NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/service';

const STATIC_FALLBACK = [
  { id: 'teladoc', name: 'Teladoc Health', specialty: 'General Medicine, Mental Health, Dermatology', wait_time: 10, commission_rate: 25, is_active: true, is_suspended: false, description: 'One of the largest telehealth platforms globally. Board-certified doctors available 24/7.', website: 'https://www.teladoc.com', languages: ['English', 'Spanish'], available_24h: true },
  { id: 'mdlive', name: 'MDLive', specialty: 'Urgent Care, Behavioral Health, Dermatology', wait_time: 15, commission_rate: 20, is_active: true, is_suspended: false, description: 'Fast access to board-certified doctors and therapists.', website: 'https://www.mdlive.com', languages: ['English'], available_24h: true },
  { id: 'doctorondemand', name: 'Doctor On Demand', specialty: 'Primary Care, Mental Health, Preventive Care', wait_time: 5, commission_rate: 22, is_active: true, is_suspended: false, description: 'Video visits with US-licensed physicians and psychologists.', website: 'https://www.doctorondemand.com', languages: ['English'], available_24h: false },
  { id: 'amwell', name: 'Amwell', specialty: 'Urgent Care, Therapy, Psychiatry, Nutrition', wait_time: 8, commission_rate: 30, is_active: true, is_suspended: false, description: 'Comprehensive telehealth covering urgent care, therapy, psychiatry, and nutrition.', website: 'https://www.amwell.com', languages: ['English', 'Spanish', 'French'], available_24h: true },
];

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (service as any)
      .from('telehealth_provider_catalog')
      .select('*')
      .eq('is_active', true)
      .eq('is_suspended', false)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      // Fall back to static list if table doesn't exist yet
      return NextResponse.json({ providers: STATIC_FALLBACK, source: 'static' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const providers = (data as any[]).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty,
      description: p.description,
      website: p.website,
      waitTime: p.wait_time,
      commissionRate: p.commission_rate,
      languages: p.languages ?? ['English'],
      available24h: p.available_24h,
      isActive: p.is_active,
      isSuspended: p.is_suspended,
    }));

    return NextResponse.json({ providers, source: 'database' });
  } catch {
    return NextResponse.json({ providers: STATIC_FALLBACK, source: 'static_fallback' });
  }
}
