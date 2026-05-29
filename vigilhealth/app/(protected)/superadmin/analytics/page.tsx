'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

interface AnalyticsData {
  totalUsers: number;
  totalBusinesses: number;
  totalCommunityReports: number;
  totalHelpRequests: number;
  totalReferrals: number;
  completedReferrals: number;
  totalQuestions: number;
  totalAnswers: number;
  premiumBusinesses: number;
  riskLevelCounts: Record<string, number>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('business_organizations').select('id', { count: 'exact', head: true }),
      supabase.from('business_organizations').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'premium'),
      supabase.from('community_reports').select('id', { count: 'exact', head: true }),
      supabase.from('help_requests').select('id', { count: 'exact', head: true }),
      supabase.from('telehealth_referrals').select('id', { count: 'exact', head: true }),
      supabase.from('telehealth_referrals').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('questions').select('id', { count: 'exact', head: true }),
      supabase.from('answers').select('id', { count: 'exact', head: true }),
      supabase.from('risk_levels').select('risk_level'),
    ]).then(([users, businesses, premiumBiz, reports, helpReqs, referrals, completedRefs, questions, answers, riskLevels]) => {
      // Count risk levels
      const riskCounts: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
      for (const row of riskLevels.data ?? []) {
        if (row.risk_level) riskCounts[row.risk_level] = (riskCounts[row.risk_level] ?? 0) + 1;
      }

      setData({
        totalUsers: users.count ?? 0,
        totalBusinesses: businesses.count ?? 0,
        premiumBusinesses: premiumBiz.count ?? 0,
        totalCommunityReports: reports.count ?? 0,
        totalHelpRequests: helpReqs.count ?? 0,
        totalReferrals: referrals.count ?? 0,
        completedReferrals: completedRefs.count ?? 0,
        totalQuestions: questions.count ?? 0,
        totalAnswers: answers.count ?? 0,
        riskLevelCounts: riskCounts,
      });
      setLoading(false);
    });
  }, []);

  const conversionRate = data && data.totalReferrals > 0
    ? Math.round((data.completedReferrals / data.totalReferrals) * 100)
    : 0;

  const statCards = data ? [
    { label: 'Total Users', value: data.totalUsers, icon: '👥', color: 'border-blue-700' },
    { label: 'Total Businesses', value: data.totalBusinesses, icon: '🏢', color: 'border-purple-700' },
    { label: 'Premium Businesses', value: data.premiumBusinesses, icon: '⭐', color: 'border-yellow-700' },
    { label: 'Community Reports', value: data.totalCommunityReports, icon: '📋', color: 'border-orange-700' },
    { label: 'Help Requests', value: data.totalHelpRequests, icon: '🤝', color: 'border-green-700' },
    { label: 'Telehealth Referrals', value: data.totalReferrals, icon: '🏥', color: 'border-teal-700' },
    { label: 'Completed Referrals', value: data.completedReferrals, icon: '✅', color: 'border-emerald-700' },
    { label: 'Referral Conversion', value: `${conversionRate}%`, icon: '📈', color: 'border-cyan-700' },
    { label: 'Q&A Questions', value: data.totalQuestions, icon: '💬', color: 'border-indigo-700' },
    { label: 'Q&A Answers', value: data.totalAnswers, icon: '💡', color: 'border-violet-700' },
  ] : [];

  const riskColors: Record<string, string> = {
    low: 'bg-emerald-500',
    moderate: 'bg-amber-500',
    high: 'bg-red-500',
    critical: 'bg-red-900',
  };

  const totalRiskRecords = data
    ? Object.values(data.riskLevelCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-gray-400 mt-1">Real-time platform metrics and engagement data</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {statCards.map((card) => (
              <div key={card.label} className={`rounded-xl bg-gray-900 border ${card.color} p-4`}>
                <div className="text-2xl mb-1">{card.icon}</div>
                <div className="text-2xl font-bold text-white">{card.value}</div>
                <div className="text-xs text-gray-400 mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Risk level distribution */}
          <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Risk Level Distribution</h2>
            {totalRiskRecords === 0 ? (
              <p className="text-gray-500 text-sm">No risk level data yet. Run the WHO/CDC cron jobs to populate data.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data?.riskLevelCounts ?? {}).map(([level, count]) => {
                  const pct = totalRiskRecords > 0 ? Math.round((count / totalRiskRecords) * 100) : 0;
                  return (
                    <div key={level}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm capitalize text-gray-300">{level}</span>
                        <span className="text-sm text-gray-400">{count} records ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div
                          className={`h-2 rounded-full ${riskColors[level] ?? 'bg-gray-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revenue estimate */}
          <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Revenue Estimate (MRR)</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Premium Listings ($29/mo)', count: data?.premiumBusinesses ?? 0, rate: 29 },
                { label: 'Telehealth Commissions ($25 avg)', count: data?.completedReferrals ?? 0, rate: 25 },
                { label: 'B2B Dashboards ($99/mo)', count: Math.max(0, (data?.totalBusinesses ?? 0) - (data?.premiumBusinesses ?? 0)), rate: 99 },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-gray-800 p-4 text-center">
                  <p className="text-xl font-bold text-green-400">${(item.count * item.rate).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.count} × ${item.rate}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-green-900/30 border border-green-700 p-3 text-center">
              <p className="text-sm text-gray-400">Estimated Total MRR</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                ${(
                  (data?.premiumBusinesses ?? 0) * 29 +
                  (data?.completedReferrals ?? 0) * 25 +
                  Math.max(0, (data?.totalBusinesses ?? 0) - (data?.premiumBusinesses ?? 0)) * 99
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
