'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  { id: 'org', title: 'Organization Setup', description: 'Set up your organization profile' },
  { id: 'location', title: 'Location Setup', description: 'Add your business locations' },
  { id: 'subscription', title: 'Choose Plan', description: 'Select a subscription tier' },
  { id: 'done', title: 'Complete', description: 'You\'re all set!' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusinessOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [orgName, setOrgName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [selectedTier, setSelectedTier] = useState<'basic' | 'professional' | 'enterprise'>('basic');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrgSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) { setError('Organization name is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/business/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_org', orgName: orgName.trim() }),
      });
      const data = await res.json() as { orgId?: string; error?: string };
      if (!res.ok || !data.orgId) { setError(data.error ?? 'Failed to create organization.'); return; }
      setOrgId(data.orgId);
      setCurrentStep(1);
    } catch { setError('An unexpected error occurred.'); }
    finally { setSubmitting(false); }
  };

  const handleLocationSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !orgId) { setError('Location name is required.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/business/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_location', orgId, locationName: locationName.trim(), locationAddress: locationAddress.trim() }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to create location.'); return; }
      setCurrentStep(2);
    } catch { setError('An unexpected error occurred.'); }
    finally { setSubmitting(false); }
  };

  const handleSubscription = async (provider: 'stripe' | 'paystack' = 'paystack') => {
    setSubmitting(true);
    setError(null);

    try {
      const endpoint = provider === 'paystack'
        ? '/api/billing/paystack/initialize'
        : '/api/billing/checkout';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          type: 'b2b',
          businessName: orgName,
          currency: provider === 'paystack' ? 'NGN' : 'USD',
        }),
      });

      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? 'Payment provider not configured. Please skip and upgrade later.');
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const skipSubscription = () => setCurrentStep(3);

  const TIERS = [
    { id: 'basic' as const, name: 'Basic', price: '$99/month', employees: 'Up to 50 employees' },
    { id: 'professional' as const, name: 'Professional', price: '$199/month', employees: 'Up to 200 employees' },
    { id: 'enterprise' as const, name: 'Enterprise', price: '$299/month', employees: 'Unlimited employees' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Onboarding</h1>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i < currentStep
                    ? 'bg-green-600 text-white'
                    : i === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < currentStep ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 ${i < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          {/* Step 0: Organization */}
          {currentStep === 0 && (
            <form onSubmit={handleOrgSetup} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Organization Setup</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}
              <button type="submit" disabled={submitting} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Saving...' : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 1: Location */}
          {currentStep === 1 && (
            <form onSubmit={handleLocationSetup} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Your First Location</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name <span className="text-red-500">*</span></label>
                <input type="text" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Main Office" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}
              <button type="submit" disabled={submitting} className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitting ? 'Saving...' : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 2: Subscription */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Choose Your Plan</h2>
              <div className="space-y-3">
                {TIERS.map((tier) => (
                  <button key={tier.id} type="button" onClick={() => setSelectedTier(tier.id)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${selectedTier === tier.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{tier.name}</p>
                        <p className="text-sm text-gray-600">{tier.employees}</p>
                      </div>
                      <p className="font-bold text-blue-600">{tier.price}</p>
                    </div>
                  </button>
                ))}
              </div>
              {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}
              <div className="space-y-2">
                <button onClick={() => void handleSubscription('paystack')} disabled={submitting}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Redirecting...' : '💳 Pay with Paystack (NGN/GHS/KES/ZAR)'}
                </button>
                <button onClick={() => void handleSubscription('stripe')} disabled={submitting}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitting ? 'Redirecting...' : '💳 Pay with Stripe (USD/EUR/GBP)'}
                </button>
              </div>
              <button onClick={skipSubscription} className="w-full text-sm text-gray-500 hover:underline">
                Skip for now (free plan)
              </button>
            </div>
          )}

          {/* Step 3: Done */}
          {currentStep === 3 && (
            <div className="text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold text-gray-900">You&apos;re all set!</h2>
              <p className="text-gray-600">Your business account is ready. Start monitoring employee wellness.</p>
              <a href="/business/dashboard" className="inline-block rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                Go to Dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
