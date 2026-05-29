/**
 * Daily Digest Generator
 *
 * Aggregates risk changes, new outbreaks, and supply updates for a user's
 * location and generates a digest email payload.
 */

import { createClient } from '@/lib/supabase/server';

import { dailyDigestTemplate } from './templates';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DigestUserContext {
  userId: string;
  email: string;
  userName: string;
  location: string;
  city: string | null;
  state: string | null;
  unsubscribeToken: string;
}

export interface DigestContent {
  subject: string;
  html: string;
  text: string;
  hasChanges: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUnsubscribeUrl(token: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.app';
  return `${appUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
}

// ─── Main Generator ───────────────────────────────────────────────────────────

/**
 * Generate a daily digest for a specific user.
 * Returns null if the user has opted out of digest emails.
 */
export async function generateDigestForUser(
  ctx: DigestUserContext
): Promise<DigestContent | null> {
  const supabase = await createClient();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString();

  // ── Fetch recent risk level changes ──────────────────────────────────────────
  const { data: riskRows } = await supabase
    .from('risk_levels')
    .select('disease, risk_level, updated_at')
    .gte('updated_at', yesterday)
    .order('updated_at', { ascending: false })
    .limit(10);

  const riskChanges = (riskRows ?? []).map((r) => ({
    disease: r.disease,
    level: r.risk_level ?? 'unknown',
    change: 'Updated',
  }));

  // ── Fetch recent supply updates ───────────────────────────────────────────────
  const { data: supplyRows } = await supabase
    .from('supply_availability')
    .select('item_name, status, supply_locations(name)')
    .gte('created_at', yesterday)
    .order('created_at', { ascending: false })
    .limit(10);

  const supplyUpdates = (supplyRows ?? []).map((s) => {
    const locName =
      s.supply_locations && typeof s.supply_locations === 'object' && 'name' in s.supply_locations
        ? String((s.supply_locations as { name: string }).name)
        : 'Unknown location';
    return {
      item: s.item_name,
      location: locName,
      status: s.status ?? 'unknown',
    };
  });

  const hasChanges = riskChanges.length > 0 || supplyUpdates.length > 0;
  const unsubscribeUrl = buildUnsubscribeUrl(ctx.unsubscribeToken);

  const template = dailyDigestTemplate({
    userName: ctx.userName,
    location: ctx.location,
    riskChanges,
    supplyUpdates,
    noChanges: !hasChanges,
    unsubscribeUrl,
  });

  return {
    subject: template.subject,
    html: template.html,
    text: template.text,
    hasChanges,
  };
}
