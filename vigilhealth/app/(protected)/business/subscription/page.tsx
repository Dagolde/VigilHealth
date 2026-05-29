'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { BusinessOrganization } from '@/lib/supabase/types';

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusinessSubscriptionPage() {
  const [org, setOrg] = useState<BusinessOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated.');
        setLoading(false);
        return;
      }

      const { data: businessUser } = await supabase
        .from('business_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!businessUser) {
        setError('No business account found.');
        setLoading(false);
        return;
      }

      if (!businessUser.organization_id) {
        setError('No organization associated with your account.');
        setLoading(false);
        return;
      }

      const { data: orgData } = await supabase
        .from('business_organizations')
        .select('*')
        .eq('id', businessUser.organization_id)
        .single();

      setOrg(orgData);
      setLoading(false);
    }

    void load();
  }, [supabase]);

  const handleUpgrade = async (tier: string) => {
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, type: 'b2b', businessName: org?.name }),
    });

    const data = await response.json() as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? 'Failed to create checkout session.');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    alert('To cancel, please contact support@vigilhealth.app');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-red-700 border border-red-200">{error}</div>
      </div>
    );
  }

  const isExpired =
    org?.subscription_expires_at && new Date(org.subscription_expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Subscription Management</h1>

        {/* Current Plan */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 capitalize">
                {org?.subscription_tier ?? 'Free'} Plan
              </p>
              {org?.subscription_expires_at && (
                <p className={`text-sm mt-1 ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                  {isExpired ? 'Expired' : 'Renews'} on{' '}
                  {new Date(org.subscription_expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                isExpired
                  ? 'bg-red-100 text-red-800'
                  : org?.subscription_tier === 'free'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-100 text-green-800'
              }`}
            >
              {isExpired ? 'Expired' : org?.subscription_tier === 'free' ? 'Free' : 'Active'}
            </span>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="space-y-3">
            {[
              { tier: 'basic', name: 'Basic', price: '$99/month', employees: 'Up to 50 employees' },
              { tier: 'professional', name: 'Professional', price: '$199/month', employees: 'Up to 200 employees' },
              { tier: 'enterprise', name: 'Enterprise', price: '$299/month', employees: 'Unlimited employees' },
            ].map((plan) => (
              <div
                key={plan.tier}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{plan.name}</p>
                  <p className="text-sm text-gray-600">{plan.employees}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-600">{plan.price}</span>
                  <button
                    onClick={() => void handleUpgrade(plan.tier)}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    {org?.subscription_tier === plan.tier ? 'Current' : 'Upgrade'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel */}
        {org?.subscription_tier !== 'free' && !isExpired && (
          <div className="text-center">
            <button
              onClick={() => void handleCancel()}
              className="text-sm text-red-500 hover:underline"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
