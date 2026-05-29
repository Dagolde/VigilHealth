'use client';

import { useEffect, useState } from 'react';

import type { ProviderAvailability } from '@/lib/telehealth/types';

interface BookingData {
  success: boolean;
  bookingId?: string;
  referralCode?: string;
  confirmationUrl?: string;
  provider?: {
    id: string;
    name: string;
  };
}

interface TelehealthProviderListProps {
  symptomSummary: string;
  onBookingComplete?: (bookingData: BookingData) => void;
  className?: string;
}

export function TelehealthProviderList({
  symptomSummary,
  onBookingComplete,
  className = '',
}: TelehealthProviderListProps) {
  const [providers, setProviders] = useState<ProviderAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingProvider, setBookingProvider] = useState<string | null>(null);
  const [userConsent, setUserConsent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Fetch provider availability
  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true);
        const response = await fetch('/api/telehealth/availability');

        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }

        const data = await response.json();
        setProviders(data.providers || []);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Unable to load telehealth providers. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();
  }, []);

  // Handle booking
  async function handleBook(providerId: string) {
    if (!userConsent) {
      alert('Please consent to sharing your symptom data with the telehealth provider.');
      return;
    }

    if (!userEmail) {
      alert('Please provide your email address.');
      return;
    }

    try {
      setBookingProvider(providerId);

      const response = await fetch('/api/telehealth/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          symptomSummary,
          userConsent,
          userContact: {
            email: userEmail,
            phone: userPhone || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to book consultation');
      }

      // Booking successful
      onBookingComplete?.(data);

      // Redirect to confirmation URL if provided
      if (data.confirmationUrl) {
        window.open(data.confirmationUrl, '_blank');
      }
    } catch (err) {
      console.error('Error booking consultation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to book consultation. Please try again.';
      alert(errorMessage);
    } finally {
      setBookingProvider(null);
    }
  }

  if (loading) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading providers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-6 ${className}`}>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-gray-50 p-6 ${className}`}>
        <p className="text-gray-600">No telehealth providers available at this time.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Available Telehealth Providers</h3>

      {/* User consent and contact info */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={userConsent}
              onChange={(e) => setUserConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              I consent to sharing my symptom summary with the selected telehealth provider for
              consultation purposes.
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number (optional)
            </label>
            <input
              id="phone"
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Provider cards */}
      <div className="space-y-3">
        {providers.map((provider) => (
          <div
            key={provider.providerId}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{provider.providerName}</h4>

                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>~{provider.estimatedWaitTime} min wait</span>
                  </div>

                  {provider.isAvailable ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                      Available now
                    </span>
                  ) : (
                    <span className="text-gray-500">Currently unavailable</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleBook(provider.providerId)}
                disabled={!provider.isAvailable || bookingProvider === provider.providerId}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bookingProvider === provider.providerId ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Booking...
                  </span>
                ) : (
                  'Book Now'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-gray-50 p-3">
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> Booking a consultation will redirect you to the provider&apos;s
          platform. Your symptom summary will be shared with your consent. Referral tracking code
          will be generated for commission purposes.
        </p>
      </div>
    </div>
  );
}
