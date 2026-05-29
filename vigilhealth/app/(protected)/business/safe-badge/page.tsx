'use client';

import { useEffect, useState } from 'react';

interface BadgeStatus {
  status: 'active' | 'expired' | 'not_applied';
  expiresAt: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  safetyProtocols: string | null;
}

interface BadgeResponse extends BadgeStatus {
  error?: string;
}

export default function SafeBadgePage() {
  const [badge, setBadge] = useState<BadgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [safetyProtocols, setSafetyProtocols] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    fetch('/api/business/safe-badge')
      .then((r) => r.json())
      .then((data: BadgeResponse) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBadge(data);
          if (data.contactPerson) setContactPerson(data.contactPerson);
          if (data.contactPhone) setContactPhone(data.contactPhone);
          if (data.safetyProtocols) setSafetyProtocols(data.safetyProtocols);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load badge status');
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (safetyProtocols.trim().length < 50) {
      setError('Safety protocols description must be at least 50 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/business/safe-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safetyProtocols: safetyProtocols.trim(),
          contactPerson: contactPerson.trim(),
          contactPhone: contactPhone.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; expiresAt?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? 'Failed to submit application');
      } else {
        setSuccess(data.message ?? 'Safe Badge application submitted successfully!');
        setBadge((prev) => ({
          ...(prev ?? { contactPerson: null, contactPhone: null, safetyProtocols: null }),
          status: 'active',
          expiresAt: data.expiresAt ?? null,
        }));
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-700 border-red-200', icon: '⚠️' },
    not_applied: { label: 'Not Applied', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '🛡️' },
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  const currentStatus = badge?.status ?? 'not_applied';
  const config = statusConfig[currentStatus];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Safe Badge</h1>
        <p className="text-gray-500 mt-1">
          Apply for the VigilHealth Safe Badge to show customers your commitment to health safety.
        </p>
      </div>

      {/* Current Status */}
      <div className={`rounded-xl border p-5 ${config.color}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <p className="font-semibold text-lg">Safe Badge Status: {config.label}</p>
            {badge?.expiresAt && currentStatus === 'active' && (
              <p className="text-sm mt-0.5">
                Valid until {new Date(badge.expiresAt).toLocaleDateString()}
              </p>
            )}
            {badge?.expiresAt && currentStatus === 'expired' && (
              <p className="text-sm mt-0.5">
                Expired on {new Date(badge.expiresAt).toLocaleDateString()}. Please reapply.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {currentStatus === 'active' ? 'Update Badge Application' : 'Apply for Safe Badge'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          The Safe Badge certifies your organization follows verified health and safety protocols.
          Badge validity: 30 days.
        </p>

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety Protocols Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={safetyProtocols}
              onChange={(e) => setSafetyProtocols(e.target.value)}
              rows={5}
              placeholder="Describe your safety protocols in detail (sanitation, PPE, distancing measures, ventilation, etc.)..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              {safetyProtocols.length} / 50 characters minimum
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {submitting
              ? 'Submitting…'
              : currentStatus === 'active'
                ? 'Update Application'
                : 'Apply for Safe Badge'}
          </button>
        </form>
      </div>

      {/* Protocol Violation Info */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
        <h2 className="text-base font-semibold text-amber-800 mb-2">
          🚨 Report a Protocol Violation
        </h2>
        <p className="text-sm text-amber-700 mb-3">
          If you believe a business is misrepresenting their safety protocols or violating health
          guidelines, you can report it to VigilHealth for review.
        </p>
        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>Violations are reviewed within 48 hours</li>
          <li>Confirmed violations result in badge removal</li>
          <li>Repeat violations may result in account suspension</li>
        </ul>
        <a
          href="mailto:safety@vigilhealth.com?subject=Protocol Violation Report"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
        >
          Report Violation →
        </a>
      </div>
    </div>
  );
}
