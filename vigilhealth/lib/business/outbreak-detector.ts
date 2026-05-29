/**
 * Outbreak Detection Logic
 *
 * Detects potential outbreaks when 3+ employees report similar symptoms
 * within a 7-day window.
 */

import type { EmployeeWellnessReport } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OutbreakAlert {
  symptom: string;
  affectedCount: number;
  locationId: string | null;
  startDate: string;
  endDate: string;
  severity: 'watch' | 'warning' | 'alert';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OUTBREAK_THRESHOLD = 3; // Minimum employees with same symptom
const WINDOW_DAYS = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWithinWindow(reportedAt: string, windowDays: number): boolean {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1_000;
  return new Date(reportedAt).getTime() >= cutoff;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyze wellness reports and detect potential outbreaks.
 * Returns an array of outbreak alerts, sorted by severity.
 */
export function detectOutbreaks(
  reports: EmployeeWellnessReport[],
  locationId?: string
): OutbreakAlert[] {
  const recentReports = reports.filter(
    (r) =>
      isWithinWindow(r.reported_at, WINDOW_DAYS) &&
      (locationId === undefined || r.location_id === locationId)
  );

  if (recentReports.length < OUTBREAK_THRESHOLD) {
    return [];
  }

  // Count occurrences of each symptom
  const symptomMap = new Map<string, EmployeeWellnessReport[]>();

  for (const report of recentReports) {
    for (const symptom of report.symptoms ?? []) {
      const existing = symptomMap.get(symptom) ?? [];
      existing.push(report);
      symptomMap.set(symptom, existing);
    }
  }

  const alerts: OutbreakAlert[] = [];

  for (const [symptom, affectedReports] of symptomMap.entries()) {
    if (affectedReports.length < OUTBREAK_THRESHOLD) continue;

    const dates = affectedReports.map((r) => r.reported_at).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Determine severity based on count and symptom severity
    const severeCount = affectedReports.filter((r) => r.severity === 'severe').length;
    let severity: OutbreakAlert['severity'] = 'watch';
    if (affectedReports.length >= 10 || severeCount >= 3) {
      severity = 'alert';
    } else if (affectedReports.length >= 5 || severeCount >= 1) {
      severity = 'warning';
    }

    alerts.push({
      symptom,
      affectedCount: affectedReports.length,
      locationId: locationId ?? null,
      startDate,
      endDate,
      severity,
    });
  }

  // Sort by severity then count
  const severityOrder = { alert: 0, warning: 1, watch: 2 };
  return alerts.sort(
    (a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity] ||
      b.affectedCount - a.affectedCount
  );
}

/**
 * Check if a new report triggers an outbreak alert.
 */
export function checkNewReportForOutbreak(
  newReport: EmployeeWellnessReport,
  existingReports: EmployeeWellnessReport[]
): OutbreakAlert[] {
  const allReports = [...existingReports, newReport];
  return detectOutbreaks(allReports, newReport.location_id ?? undefined);
}
