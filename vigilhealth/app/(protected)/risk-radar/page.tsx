'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { CommunityReportForm } from '@/components/community/CommunityReportForm';

// Lazy-load the map only if Mapbox token is configured
const RiskRadarMap = dynamic(
  () => import('@/components/map/RiskRadarMap').then((m) => m.RiskRadarMap),
  { ssr: false, loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-sm">Loading map…</div> }
);

interface OutbreakRecord {
  id: string;
  disease: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  risk_score: number;
  case_count: number | null;
  location_name: string;
  country: string | null;
  state: string | null;
  source: 'who' | 'cdc' | 'community';
  source_url: string | null;
  valid_from: string;
}

const RISK_COLORS = {
  low: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-500' },
  moderate: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', badge: 'bg-amber-500' },
  high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500', badge: 'bg-red-500' },
  critical: { bg: 'bg-red-900', text: 'text-red-100', border: 'border-red-800', dot: 'bg-red-900', badge: 'bg-red-900' },
};

const SOURCE_LABELS = { who: 'WHO', cdc: 'CDC', community: 'Community' };

export default function RiskRadarPage() {
  const [outbreaks, setOutbreaks] = useState<OutbreakRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [hasMapbox, setHasMapbox] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    // Check if Mapbox token is configured
    setHasMapbox(!!process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

    // Fetch outbreak data directly from Supabase via our API
    fetch('/api/risk/outbreaks')
      .then(r => r.json())
      .then((data: { outbreaks?: OutbreakRecord[]; lastUpdated?: string; error?: string }) => {
        if (data.error) {
          setError(data.error);
        } else {
          setOutbreaks(data.outbreaks ?? []);
          setLastUpdated(data.lastUpdated ?? null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load outbreak data');
        setLoading(false);
      });
  }, []);

  const filtered = outbreaks.filter(o => {
    if (filterLevel !== 'all' && o.risk_level !== filterLevel) return false;
    if (filterSource !== 'all' && o.source !== filterSource) return false;
    return true;
  });

  // Summary stats
  const criticalCount = outbreaks.filter(o => o.risk_level === 'critical').length;
  const highCount = outbreaks.filter(o => o.risk_level === 'high').length;
  const totalCases = outbreaks.reduce((sum, o) => sum + (o.case_count ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Radar</h1>
          <p className="text-gray-500 mt-1">
            Real-time health risk levels powered by WHO and CDC data.
            {lastUpdated && <span className="ml-2 text-xs text-gray-400">Updated {new Date(lastUpdated).toLocaleString()}</span>}
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          onClick={() => setShowReportForm(true)}
          type="button"
        >
          + Report Observation
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-900">{criticalCount}</p>
          <p className="text-xs text-gray-500 mt-1">Critical Outbreaks</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-600">{highCount}</p>
          <p className="text-xs text-gray-500 mt-1">High Risk Areas</p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{totalCases.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Total Cases Tracked</p>
        </div>
      </div>

      {/* Map (only if Mapbox configured) */}
      {hasMapbox && (
        <div className="overflow-hidden rounded-xl shadow-md">
          <RiskRadarMap zoom={3} center={[0, 20]} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {['all', 'critical', 'high', 'moderate', 'low'].map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterLevel === level
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {level === 'all' ? 'All Levels' : level}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'who', 'cdc', 'community'].map(src => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterSource === src
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {src === 'all' ? 'All Sources' : SOURCE_LABELS[src as keyof typeof SOURCE_LABELS]}
            </button>
          ))}
        </div>
      </div>

      {/* Outbreak List */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Active Outbreaks
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {filtered.length}
            </span>
          </h2>
          <div className="flex gap-2 text-xs">
            {(['low', 'moderate', 'high', 'critical'] as const).map(level => (
              <span key={level} className="flex items-center gap-1 text-gray-500">
                <span className={`h-2 w-2 rounded-full ${RISK_COLORS[level].badge}`} />
                {level}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading outbreak data…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <p className="text-xs text-gray-400">Run the WHO/CDC cron jobs from the admin panel to populate data.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🌍</div>
            <p className="text-sm text-gray-600 mb-1">No outbreaks match your filters.</p>
            <p className="text-xs text-gray-400">
              {outbreaks.length === 0
                ? 'No data yet. The WHO cron job will populate this daily.'
                : 'Try changing the filters above.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((outbreak) => {
              const colors = RISK_COLORS[outbreak.risk_level];
              return (
                <li key={outbreak.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`mt-1 h-3 w-3 rounded-full shrink-0 ${colors.dot}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 text-sm">{outbreak.disease}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}>
                            {outbreak.risk_level}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            {SOURCE_LABELS[outbreak.source]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          📍 {outbreak.location_name}
                          {outbreak.country && outbreak.country !== outbreak.location_name && ` · ${outbreak.country}`}
                        </p>
                        {outbreak.case_count !== null && outbreak.case_count > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {outbreak.case_count.toLocaleString()} cases reported
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(outbreak.valid_from).toLocaleDateString()}
                      </p>
                      {outbreak.source_url && (
                        <a
                          href={outbreak.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Source →
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Data source info */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
        <p className="text-xs text-blue-700">
          <strong>Data sources:</strong> WHO Disease Outbreak News RSS feed and CDC NNDSS.
          Data updates daily via automated cron jobs. For medical emergencies call 911.
        </p>
      </div>

      {/* Community Report Modal */}
      {showReportForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowReportForm(false); }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Report Health Observation</h2>
              <button aria-label="Close" className="rounded p-1 text-gray-400 hover:text-gray-600" onClick={() => setShowReportForm(false)} type="button">✕</button>
            </div>
            <CommunityReportForm onSuccess={() => setShowReportForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
