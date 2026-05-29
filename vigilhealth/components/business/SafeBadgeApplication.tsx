'use client';

import { useState } from 'react';

// ─── Component ────────────────────────────────────────────────────────────────

interface SafeBadgeApplicationProps {
  locationId: string;
  onSuccess?: () => void;
}

export function SafeBadgeApplication({ locationId, onSuccess }: SafeBadgeApplicationProps) {
  const [protocolDescription, setProtocolDescription] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!protocolDescription.trim() || protocolDescription.trim().length < 50) {
      setError('Please provide a detailed description of your safety protocols (min 50 characters).');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Safe Badge terms and conditions.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/safe-badges/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          protocolDescription: protocolDescription.trim(),
          documentUrl: documentUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        setError(data.error ?? 'Failed to submit application.');
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center border border-green-200">
        <div className="text-4xl mb-2">✅</div>
        <h3 className="text-lg font-semibold text-green-800">Application Submitted!</h3>
        <p className="text-green-700 mt-1">
          Your Safe Badge application is under review. You will be notified within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
        <h3 className="font-semibold text-emerald-800 mb-1">✓ Verified Safe Badge</h3>
        <p className="text-sm text-emerald-700">
          The Safe Badge certifies that your location follows verified health and safety protocols.
          Badge validity: 30 days. Subscription: $49/month.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Safety Protocol Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={protocolDescription}
          onChange={(e) => setProtocolDescription(e.target.value)}
          rows={5}
          placeholder="Describe your safety protocols in detail (sanitation, PPE, distancing measures, etc.)..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          {protocolDescription.length}/50 characters minimum
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Documentation URL (optional)
        </label>
        <input
          type="url"
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          placeholder="https://... (link to safety documentation)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">
          I certify that the information provided is accurate and agree to monthly re-verification
          requirements. I understand the badge will be removed if protocols are not maintained.
        </span>
      </label>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting...' : 'Apply for Safe Badge'}
      </button>
    </form>
  );
}
