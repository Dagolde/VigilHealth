'use client';

import { useState } from 'react';

const CRON_JOBS = [
  { name: 'Fetch WHO Data', path: '/api/cron/fetch-who-data', schedule: 'Daily midnight' },
  { name: 'Fetch CDC Data', path: '/api/cron/fetch-cdc-data', schedule: 'Daily 2 AM' },
  { name: 'Send Daily Digest', path: '/api/cron/send-digest', schedule: 'Daily 7 AM' },
  { name: 'Reverify Safe Badges', path: '/api/cron/reverify-badges', schedule: 'Daily 1 AM' },
  { name: 'Data Retention Cleanup', path: '/api/cron/data-retention', schedule: 'Sundays 3 AM' },
  { name: 'Help Request Reminders', path: '/api/cron/help-request-reminders', schedule: 'Daily 9 AM' },
];

export default function SystemPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const triggerCron = async (path: string, name: string) => {
    setRunning(name);
    try {
      const res = await fetch('/api/superadmin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      const data = await res.json() as Record<string, unknown>;
      setResults(prev => ({ ...prev, [name]: res.ok ? `✅ ${JSON.stringify(data)}` : `❌ ${JSON.stringify(data)}` }));
    } catch (err) {
      setResults(prev => ({ ...prev, [name]: `❌ Network error: ${String(err)}` }));
    }
    setRunning(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-gray-400 mt-1">Manually trigger cron jobs and monitor system status</p>
      </div>

      <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cron Jobs</h2>
        <div className="space-y-3">
          {CRON_JOBS.map((job) => (
            <div key={job.name} className="rounded-lg bg-gray-800 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{job.name}</p>
                  <p className="text-xs text-gray-400">{job.schedule} · <code className="text-purple-300">{job.path}</code></p>
                </div>
                <button
                  className="shrink-0 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-600 disabled:opacity-50"
                  disabled={running === job.name}
                  onClick={() => triggerCron(job.path, job.name)}
                  type="button"
                >
                  {running === job.name ? 'Running...' : 'Run Now'}
                </button>
              </div>
              {results[job.name] && (
                <p className="mt-2 text-xs font-mono text-gray-300 bg-gray-900 rounded p-2 break-all">
                  {results[job.name]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Environment</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { label: 'Deployment Phase', value: 'phase1 (Vercel + Supabase)' },
            { label: 'Supabase', value: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Connected' : '❌ Not configured' },
            { label: 'Mapbox', value: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✅ Configured' : '⚠️ Not set' },
            { label: 'Paystack', value: '✅ Configured (NGN/GHS/KES/ZAR)' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-gray-800 px-4 py-3">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm text-white mt-0.5 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
