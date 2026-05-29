'use client';

/**
 * PaymentMethodSelector
 *
 * Shows Stripe (international) and Paystack (Africa) payment options.
 * Automatically suggests Paystack for African currencies.
 */

import { useState } from 'react';

import {
  formatAmount,
  getCurrencyLabel,
  getPaymentProvider,
  type SupportedCurrency,
} from '@/lib/billing/payment-router';
import { PAYSTACK_NGN_PRICES, PAYSTACK_USD_PRICES } from '@/lib/billing/paystack-client';

// ─── Stripe prices (cents) ────────────────────────────────────────────────────
const STRIPE_USD_PRICES: Record<string, Record<string, number>> = {
  business_listing: { basic: 2900, premium: 7900 },
  safe_badge: { standard: 4900 },
  b2b: { basic: 9900, professional: 19900, enterprise: 29900 },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentMethodSelectorProps {
  type: string;
  tier: string;
  businessName?: string;
  _onSuccess?: (provider: 'stripe' | 'paystack', reference?: string) => void;  className?: string;
}

const CURRENCY_OPTIONS: { value: SupportedCurrency; label: string; flag: string }[] = [
  { value: 'NGN', label: 'Nigerian Naira (₦)', flag: '🇳🇬' },
  { value: 'GHS', label: 'Ghanaian Cedi (₵)', flag: '🇬🇭' },
  { value: 'KES', label: 'Kenyan Shilling (KSh)', flag: '🇰🇪' },
  { value: 'ZAR', label: 'South African Rand (R)', flag: '🇿🇦' },
  { value: 'USD', label: 'US Dollar ($)', flag: '🌍' },
  { value: 'GBP', label: 'British Pound (£)', flag: '🇬🇧' },
  { value: 'EUR', label: 'Euro (€)', flag: '🇪🇺' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentMethodSelector({
  type,
  tier,
  businessName,
  _onSuccess,
  className = '',
}: PaymentMethodSelectorProps) {
  const [currency, setCurrency] = useState<SupportedCurrency>('NGN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = getPaymentProvider(currency);
  const isPaystack = provider === 'paystack';

  // Get the display amount
  const getDisplayAmount = (): string => {
    if (isPaystack) {
      const prices = currency === 'USD' ? PAYSTACK_USD_PRICES : PAYSTACK_NGN_PRICES;
      const amount = prices[type]?.[tier];
      if (!amount) return 'N/A';
      return formatAmount(amount, currency);
    } else {
      const amount = STRIPE_USD_PRICES[type]?.[tier];
      if (!amount) return 'N/A';
      return formatAmount(amount, 'USD');
    }
  };

  const handlePayWithPaystack = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, tier, currency, businessName }),
      });
      const data = await res.json() as { url?: string; reference?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to initialize payment');
        return;
      }
      // Redirect to Paystack hosted page
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithStripe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, tier, businessName }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Failed to create checkout session');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Currency selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="currency-select">
          Select your currency
        </label>
        <select
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          id="currency-select"
          onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
          value={currency}
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.flag} {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {getCurrencyLabel(currency)} — powered by{' '}
          <span className={`font-medium ${isPaystack ? 'text-green-600' : 'text-blue-600'}`}>
            {isPaystack ? 'Paystack' : 'Stripe'}
          </span>
        </p>
      </div>

      {/* Price display */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-2xl font-bold text-gray-900">{getDisplayAmount()}</p>
        <p className="text-sm text-gray-500">per month</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Payment button */}
      {isPaystack ? (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
          onClick={handlePayWithPaystack}
          type="button"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
              Pay with Paystack
            </>
          )}
        </button>
      ) : (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading}
          onClick={handlePayWithStripe}
          type="button"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
              Pay with Stripe
            </>
          )}
        </button>
      )}

      {/* Provider info */}
      <p className="text-center text-xs text-gray-400">
        {isPaystack
          ? 'Supports cards, bank transfer, USSD, and mobile money'
          : 'Supports cards and other international payment methods'}
      </p>
    </div>
  );
}
