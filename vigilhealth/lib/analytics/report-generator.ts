/**
 * Weekly Analytics Report Generator
 *
 * Generates weekly analytics summaries for admin review.
 */

import { createClient } from '@/lib/supabase/server';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyAnalyticsReport {
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  metrics: {
    newUsers: number;
    activeUsers: number;
    communityReports: number;
    supplyUpdates: number;
    helpRequestsCreated: number;
    helpRequestsFulfilled: number;
    questionsAsked: number;
    answersSubmitted: number;
    telehealthReferrals: number;
    telehealthCompletions: number;
    conversionRate: number;
  };
  topLocations: Array<{ location: string; reportCount: number }>;
}

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generate a weekly analytics report.
 */
export async function generateWeeklyReport(): Promise<WeeklyAnalyticsReport> {
  const supabase = await createClient();

  const weekEnd = new Date();
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1_000);

  const weekStartStr = weekStart.toISOString();
  const weekEndStr = weekEnd.toISOString();

  // Fetch metrics in parallel
  const [
    communityReportsResult,
    supplyUpdatesResult,
    helpRequestsResult,
    questionsResult,
    answersResult,
    referralsResult,
  ] = await Promise.all([
    supabase
      .from('community_reports')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStartStr)
      .lte('created_at', weekEndStr),

    supabase
      .from('supply_availability')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStartStr)
      .lte('created_at', weekEndStr),

    supabase
      .from('help_requests')
      .select('id, status')
      .gte('created_at', weekStartStr)
      .lte('created_at', weekEndStr),

    supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStartStr)
      .lte('created_at', weekEndStr),

    supabase
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekStartStr)
      .lte('created_at', weekEndStr),

    supabase
      .from('telehealth_referrals')
      .select('id, status')
      .gte('created_at', weekStartStr)
      .lte('created_at', weekEndStr),
  ]);

  const helpRequests = helpRequestsResult.data ?? [];
  const referrals = referralsResult.data ?? [];

  const helpRequestsFulfilled = helpRequests.filter((r) => r.status === 'fulfilled').length;
  const telehealthCompletions = referrals.filter((r) => r.status === 'completed').length;
  const conversionRate =
    referrals.length > 0
      ? Math.round((telehealthCompletions / referrals.length) * 10000) / 100
      : 0;

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    generatedAt: new Date().toISOString(),
    metrics: {
      newUsers: 0, // Would query auth.users in production
      activeUsers: 0, // Would query session data in production
      communityReports: communityReportsResult.count ?? 0,
      supplyUpdates: supplyUpdatesResult.count ?? 0,
      helpRequestsCreated: helpRequests.length,
      helpRequestsFulfilled,
      questionsAsked: questionsResult.count ?? 0,
      answersSubmitted: answersResult.count ?? 0,
      telehealthReferrals: referrals.length,
      telehealthCompletions,
      conversionRate,
    },
    topLocations: [], // Would aggregate from community_reports in production
  };
}
