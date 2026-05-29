'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionTier = 'basic' | 'premium';

interface RegisterFormData {
  businessName: string;
  address: string;
  phone: string;
  hours: string;
  tier: SubscriptionTier;
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'basic' as SubscriptionTier,
    name: 'Basic Listing',
    price: '$29/month',
    features: ['Standard visibility', 'Contact info display', 'Hours display'],
  },
  {
    id: 'premium' as SubscriptionTier,
    name: 'Premium Listing',
    price: '$79/month',
    features: [
      'Top of search results',
      'Photos & special offers',
      'Detailed descriptions',
      'Priority support',
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusinessRegisterPage() {
  const [form, setForm] = useState<RegisterFormData>({
    businessName: '',
    address: '',
    phone: '',
    hours: '',
    tier: 'basic',
  });
  const [step, setStep] = useState<'details' | 'payment' | 'done'>('details');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.businessName.trim() || !form.address.trim()) {
      setError('Business name and address are required.');
      return;
    }

    setStep('payment');
  };

  const handlePayment = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: form.tier,
          businessName: form.businessName,
          type: 'business_listing',
        }),
      });

      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? 'Failed to create checkout session.');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipPayment = async () => {
    // For demo: create listing without payment
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in.');
        return;
      }

      // Create business organization
      const { data: org, error: orgError } = await supabase
        .from('business_organizations')
        .insert({
          name: form.businessName,
          subscription_tier: 'free',
        })
        .select('id')
        .single();

      if (orgError || !org) {
        setError('Failed to create business listing.');
        return;
      }

      setStep('done');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="rounded-lg bg-white p-8 text-center shadow-sm border border-gray-200 max-w-md w-full">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-gray-900">Business Registered!</h2>
          <p className="text-gray-600 mt-2">Your listing is now live on VigilHealth.</p>
          <a
            href="/business/dashboard"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Register Your Business</h1>

        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                <input
                  type="text"
                  value={form.hours}
                  onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))}
                  placeholder="e.g. Mon-Fri 9am-5pm"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Tier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subscription Tier
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, tier: tier.id }))}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      form.tier === tier.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">{tier.name}</p>
                    <p className="text-blue-600 font-bold text-sm mt-0.5">{tier.price}</p>
                    <ul className="mt-2 space-y-0.5">
                      {tier.features.map((f) => (
                        <li key={f} className="text-xs text-gray-600">
                          ✓ {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Continue to Payment
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Complete Payment</h2>
            <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>{form.businessName}</strong>
              </p>
              <p className="text-sm text-gray-600">
                {TIERS.find((t) => t.id === form.tier)?.name} —{' '}
                {TIERS.find((t) => t.id === form.tier)?.price}
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            <button
              onClick={() => void handlePayment()}
              disabled={submitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Redirecting...' : 'Pay with Stripe'}
            </button>

            <button
              onClick={() => void handleSkipPayment()}
              disabled={submitting}
              className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Skip payment (free listing)
            </button>

            <button
              onClick={() => setStep('details')}
              className="w-full text-sm text-gray-500 hover:underline"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
