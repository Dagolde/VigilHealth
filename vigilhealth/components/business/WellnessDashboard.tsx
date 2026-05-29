'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { EmployeeWellnessReport } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyCount {
  date: string;
  count: number;
  absent: number;
}

interface SymptomCount {
  symptom: string;
  count: number;
}

interface WellnessDashboardProps {
  organizationId: string;
  locationId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDate(reports: EmployeeWellnessReport[]): DailyCount[] {
  const map = new Map<string, { count: number; absent: number }>();

  for (const r of reports) {
    const date = r.reported_at.slice(0, 10);
    const existing = map.get(date) ?? { count: 0, absent: 0 };
    map.set(date, {
      count: existing.count + 1,
      absent: existing.absent + (r.is_absent ? 1 : 0),
    });
  }

  return Array.from(map.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function countSymptoms(reports: EmployeeWellnessReport[]): SymptomCount[] {
  const map = new Map<string, number>();

  for (const r of reports) {
    for (const symptom of r.symptoms ?? []) {
      map.set(symptom, (map.get(symptom) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WellnessDashboard({ organizationId, locationId }: WellnessDashboardProps) {
  const [reports, setReports] = useState<EmployeeWellnessReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [outbreakAlert, setOutbreakAlert] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1_000).toISOString();

      let query = supabase
        .from('employee_wellness_reports')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('reported_at', sevenDaysAgo)
        .order('reported_at', { ascending: false });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data } = await query;
      const reportData = data ?? [];
      setReports(reportData);

      // Check for outbreak pattern: 3+ employees with similar symptoms in 7 days
      if (reportData.length >= 3) {
        const symptomCounts = countSymptoms(reportData);
        const topSymptom = symptomCounts[0];
        if (topSymptom && topSymptom.count >= 3) {
          setOutbreakAlert(
            `⚠️ Potential outbreak detected: ${topSymptom.count} employees reported "${topSymptom.symptom}" in the last 7 days.`
          );
        }
      }

      setLoading(false);
    }

    void load();
  }, [supabase, organizationId, locationId]);

  const dailyCounts = groupByDate(reports);
  const symptomCounts = countSymptoms(reports);
  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Outbreak Alert */}
      {outbreakAlert && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-300">
          <p className="text-sm font-semibold text-red-800">{outbreakAlert}</p>
          <p className="text-xs text-red-700 mt-1">
            Consider notifying employees and reviewing safety protocols.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Reports (7 days)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{reports.length}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Absences</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {reports.filter((r) => r.is_absent).length}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Severe Cases</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {reports.filter((r) => r.severity === 'severe').length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Daily Trend Chart (CSS bars) */}
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Reports (7 days)</h3>
            {dailyCounts.length === 0 ? (
              <p className="text-sm text-gray-500">No data for this period.</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {dailyCounts.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${(day.count / maxCount) * 100}%`, minHeight: '4px' }}
                      title={`${day.count} reports`}
                    />
                    <span className="text-xs text-gray-500 rotate-45 origin-left">
                      {day.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Symptoms */}
          <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Reported Symptoms</h3>
            {symptomCounts.length === 0 ? (
              <p className="text-sm text-gray-500">No symptoms reported.</p>
            ) : (
              <div className="space-y-2">
                {symptomCounts.map((s) => (
                  <div key={s.symptom} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-32 shrink-0">{s.symptom}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${(s.count / (symptomCounts[0]?.count ?? 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-6 text-right">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
