/**
 * Commission Report Generator
 *
 * Generates monthly commission reconciliation reports for telehealth affiliates.
 */

import { getCommissionSummary } from './referral-tracking';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyCommissionReport {
  month: string; // YYYY-MM
  generatedAt: string;
  providers: Array<{
    providerId: string;
    providerName: string;
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalCommission: number;
    earnedCommission: number;
    conversionRate: number;
  }>;
  totals: {
    totalReferrals: number;
    completedReferrals: number;
    totalEarned: number;
    pendingCommission: number;
  };
}

// ─── Generator ────────────────────────────────────────────────────────────────

/**
 * Generate a monthly commission report for a given month.
 * @param year - Full year (e.g. 2024)
 * @param month - Month number 1-12
 */
export async function generateMonthlyReport(
  year: number,
  month: number
): Promise<MonthlyCommissionReport | null> {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const summary = await getCommissionSummary(startDate, endDate);

  if (!summary) return null;

  const providers = Object.entries(summary).map(([providerId, data]) => ({
    providerId,
    providerName: data.providerName,
    totalReferrals: data.totalReferrals,
    completedReferrals: data.completedReferrals,
    pendingReferrals: data.pendingReferrals,
    totalCommission: data.totalCommission,
    earnedCommission: data.earnedCommission,
    conversionRate:
      data.totalReferrals > 0
        ? Math.round((data.completedReferrals / data.totalReferrals) * 10000) / 100
        : 0,
  }));

  const totals = providers.reduce(
    (acc, p) => ({
      totalReferrals: acc.totalReferrals + p.totalReferrals,
      completedReferrals: acc.completedReferrals + p.completedReferrals,
      totalEarned: acc.totalEarned + p.earnedCommission,
      pendingCommission: acc.pendingCommission + (p.totalCommission - p.earnedCommission),
    }),
    { totalReferrals: 0, completedReferrals: 0, totalEarned: 0, pendingCommission: 0 }
  );

  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  return {
    month: monthStr,
    generatedAt: new Date().toISOString(),
    providers,
    totals,
  };
}

/**
 * Format a commission report as a CSV string.
 */
export function formatReportAsCsv(report: MonthlyCommissionReport): string {
  const header = 'Provider,Total Referrals,Completed,Pending,Conversion Rate,Earned Commission\n';
  const rows = report.providers
    .map(
      (p) =>
        `"${p.providerName}",${p.totalReferrals},${p.completedReferrals},${p.pendingReferrals},${p.conversionRate}%,$${(p.earnedCommission / 100).toFixed(2)}`
    )
    .join('\n');

  const totalsRow = `\nTOTALS,${report.totals.totalReferrals},${report.totals.completedReferrals},,,$${(report.totals.totalEarned / 100).toFixed(2)}`;

  return header + rows + totalsRow;
}
