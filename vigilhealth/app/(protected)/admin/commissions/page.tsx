'use client';

import { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommissionSummary {
  providerName: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalCommission: number;
  earnedCommission: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CommissionsPage() {
  const [summary, setSummary] = useState<Record<string, CommissionSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          startDate: dateRange.start,
          endDate: dateRange.end,
        });
        const response = await fetch(`/api/telehealth/commission-report?${params.toString()}`);
        const data = await response.json() as { summary?: Record<string, CommissionSummary>; error?: string };

        if (!response.ok) {
          setError(data.error ?? 'Failed to load commission data.');
          return;
        }

        setSummary(data.summary ?? {});
      } catch {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [dateRange]);

  const totalEarned = Object.values(summary).reduce((sum, s) => sum + s.earnedCommission, 0);
  const totalReferrals = Object.values(summary).reduce((sum, s) => sum + s.totalReferrals, 0);
  const totalCompleted = Object.values(summary).reduce((sum, s) => sum + s.completedReferrals, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Commission Report</h1>
          <p className="text-gray-600 mt-1">Telehealth affiliate commission tracking.</p>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6 flex flex-wrap gap-4 items-end bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Referrals</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalReferrals}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totalCompleted}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Earned</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              ${(totalEarned / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Provider Breakdown */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">{error}</div>
        ) : Object.keys(summary).length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 border border-gray-200">
            No commission data for the selected period.
          </div>
        ) : (
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Referrals
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Conversion
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Earned
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(summary).map(([providerId, data]) => (
                  <tr key={providerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{data.providerName}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{data.totalReferrals}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{data.completedReferrals}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {data.totalReferrals > 0
                        ? `${Math.round((data.completedReferrals / data.totalReferrals) * 100)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      ${(data.earnedCommission / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
