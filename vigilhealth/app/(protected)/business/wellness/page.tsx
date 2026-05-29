'use client';

import { useEffect, useState } from 'react';

const SYMPTOMS = [
  { id: 'fever', label: 'Fever' },
  { id: 'cough', label: 'Cough' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'headache', label: 'Headache' },
  { id: 'body_aches', label: 'Body Aches' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'sore_throat', label: 'Sore Throat' },
  { id: 'shortness_of_breath', label: 'Shortness of Breath' },
  { id: 'runny_nose', label: 'Runny Nose' },
  { id: 'loss_of_taste_smell', label: 'Loss of Taste/Smell' },
] as const;

type SymptomId = (typeof SYMPTOMS)[number]['id'];

interface WellnessSummary {
  totalReports: number;
  recentReports: number;
  absentToday: number;
  topSymptoms: string[];
}

interface WellnessResponse extends WellnessSummary {
  error?: string;
}

export default function WellnessPage() {
  const [summary, setSummary] = useState<WellnessSummary | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Form state
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomId[]>([]);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe' | ''>('');
  const [isAbsent, setIsAbsent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchSummary = () => {
    fetch('/api/business/wellness')
      .then((r) => r.json())
      .then((data: WellnessResponse) => {
        if (data.error) {
          setDataError(data.error);
        } else {
          setSummary(data);
        }
        setLoadingData(false);
      })
      .catch(() => {
        setDataError('Failed to load wellness data');
        setLoadingData(false);
      });
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const toggleSymptom = (id: SymptomId) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedSymptoms.length === 0) {
      setFormError('Please select at least one symptom.');
      return;
    }
    if (!severity) {
      setFormError('Please select a severity level.');
      return;
    }
    if (!consent) {
      setFormError('You must provide consent before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/business/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          severity,
          isAbsent,
          consent,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setFormError(data.error ?? 'Failed to submit report');
      } else {
        setFormSuccess(true);
        setSelectedSymptoms([]);
        setSeverity('');
        setIsAbsent(false);
        setConsent(false);
        // Refresh summary
        setLoadingData(true);
        fetchSummary();
      }
    } catch {
      setFormError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Wellness Reporting</h1>
        <p className="text-gray-500 mt-1">
          Submit anonymous wellness reports to help track organizational health trends.
        </p>
      </div>

      {/* Summary Chart */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Wellness Summary (Last 7 Days)</h2>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : dataError ? (
          <p className="text-sm text-red-600">{dataError}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Reports (7 days)', value: summary?.totalReports ?? 0, color: 'text-blue-600' },
                { label: 'Reports Today', value: summary?.recentReports ?? 0, color: 'text-green-600' },
                { label: 'Absent Today', value: summary?.absentToday ?? 0, color: 'text-orange-600' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {(summary?.topSymptoms.length ?? 0) > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Top Symptoms This Week</p>
                <div className="space-y-2">
                  {summary?.topSymptoms.map((symptom, i) => {
                    const barWidth = Math.max(10, 100 - i * 15);
                    return (
                      <div key={symptom} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-32 capitalize shrink-0">
                          {symptom.replace(/_/g, ' ')}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right shrink-0">
                          #{i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {summary?.totalReports === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No wellness reports in the last 7 days.
              </p>
            )}
          </>
        )}
      </div>

      {/* Report Form */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Submit Wellness Report</h2>
        <p className="text-sm text-gray-500 mb-4">
          Your report is completely anonymous. No personal identifiers are stored.
        </p>

        {formSuccess && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            ✅ Report submitted anonymously. Thank you for helping keep your team safe.
          </div>
        )}

        {formError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {/* Symptoms */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Symptoms <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SYMPTOMS.map((symptom) => (
                <label
                  key={symptom.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm ${
                    selectedSymptoms.includes(symptom.id)
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(symptom.id)}
                    onChange={() => toggleSymptom(symptom.id)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {symptom.label}
                </label>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Severity <span className="text-red-500">*</span>
            </p>
            <div className="flex gap-3">
              {(['mild', 'moderate', 'severe'] as const).map((level) => (
                <label
                  key={level}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm font-medium capitalize ${
                    severity === level
                      ? level === 'mild'
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : level === 'moderate'
                          ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                          : 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={level}
                    checked={severity === level}
                    onChange={() => setSeverity(level)}
                    className="sr-only"
                  />
                  {level === 'mild' ? '🟢' : level === 'moderate' ? '🟡' : '🔴'} {level}
                </label>
              ))}
            </div>
          </div>

          {/* Absent */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAbsent}
              onChange={(e) => setIsAbsent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">I am absent from work today</span>
          </label>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              I consent to submitting this anonymous wellness report. I understand no personal
              identifiers are stored and this data is used only for organizational health tracking.{' '}
              <span className="text-red-500">*</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Anonymous Report'}
          </button>
        </form>
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-700">
          <strong>Privacy Notice:</strong> All wellness reports are fully anonymous. A random ID is
          generated for each submission — your real identity is never stored or linked to any report.
        </p>
      </div>
    </div>
  );
}
