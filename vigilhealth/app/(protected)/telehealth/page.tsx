'use client';

import { useEffect, useState } from 'react';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  waitTime: number;
  commissionRate: number;
  isActive: boolean;
  description: string;
  website: string;
  languages: string[];
  available24h: boolean;
}

interface Referral {
  id: string;
  provider_id: string;
  provider_name: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
}

export default function TelehealthPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [consent, setConsent] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'providers' | 'history'>('providers');

  useEffect(() => {
    Promise.all([
      fetch('/api/telehealth/providers').then(r => r.json()),
      fetch('/api/telehealth/my-referrals').then(r => r.json()),
    ]).then(([provData, refData]: [{ providers?: Provider[] }, { referrals?: Referral[] }]) => {
      setProviders(provData.providers ?? []);
      setReferrals(refData.referrals ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleBook = async (provider: Provider) => {
    if (!consent) { setBookingError('Please provide consent before booking.'); return; }
    if (!symptoms.trim()) { setBookingError('Please describe your symptoms briefly.'); return; }

    setBooking(provider.id);
    setBookingError(null);

    try {
      const res = await fetch('/api/telehealth/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          symptomSummary: symptoms.trim(),
          userConsent: consent,
          userContact: { email: '' }, // filled server-side from auth
        }),
      });
      const data = await res.json() as { referralCode?: string; confirmationUrl?: string; error?: string };

      if (!res.ok) {
        setBookingError(data.error ?? 'Failed to book consultation');
      } else {
        setBookingSuccess(`Booking confirmed! Referral code: ${data.referralCode ?? 'N/A'}`);
        if (data.confirmationUrl) window.open(data.confirmationUrl, '_blank');
        // Refresh referrals
        fetch('/api/telehealth/my-referrals').then(r => r.json()).then((d: { referrals?: Referral[] }) => setReferrals(d.referrals ?? []));
      }
    } catch {
      setBookingError('Network error. Please try again.');
    } finally {
      setBooking(null);
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Telehealth</h1>
        <p className="text-gray-500 mt-1">
          Connect with licensed healthcare providers from the comfort of your home.
        </p>
      </div>

      {/* Medical disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm text-amber-800">
          <strong>Medical Disclaimer:</strong> Telehealth consultations are provided by independent licensed healthcare providers.
          VigilHealth earns an affiliate commission when you book. For emergencies, call 911 immediately.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['providers', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'history' ? 'My Consultations' : 'Find a Provider'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : activeTab === 'providers' ? (
        <div className="space-y-6">
          {/* Symptom input */}
          <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Describe your symptoms</h2>
            <textarea
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              rows={3}
              placeholder="e.g. Fever for 2 days, sore throat, fatigue..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-start gap-2 mt-3 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-xs text-gray-600">
                I consent to sharing my symptom summary with the selected telehealth provider for the purpose of booking a consultation. <span className="text-red-500">*</span>
              </span>
            </label>
            {bookingError && <p className="mt-2 text-sm text-red-600">{bookingError}</p>}
            {bookingSuccess && <p className="mt-2 text-sm text-green-600">{bookingSuccess}</p>}
          </div>

          {/* Provider cards */}
          {providers.length === 0 ? (
            <div className="rounded-xl bg-white border border-gray-200 p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">🏥</div>
              <p>No telehealth providers available right now.</p>
              <p className="text-xs mt-1">Check back soon or contact support.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {providers.filter(p => p.isActive).map(provider => (
                <div key={provider.id} className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <p className="text-xs text-gray-500">{provider.specialty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Available
                      </div>
                      {provider.available24h && <p className="text-xs text-gray-400">24/7</p>}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{provider.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700">
                      ~{provider.waitTime} min wait
                    </span>
                    {provider.languages.map(lang => (
                      <span key={lang} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{lang}</span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleBook(provider)}
                      disabled={booking === provider.id || !consent || !symptoms.trim()}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {booking === provider.id ? 'Booking…' : 'Book Consultation'}
                    </button>
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Learn more
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Consultation history */
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {referrals.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p>No consultations yet.</p>
              <p className="text-xs mt-1">Book your first telehealth consultation above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {referrals.map(ref => (
                <li key={ref.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{ref.provider_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Code: <code className="bg-gray-100 px-1 rounded">{ref.referral_code}</code>
                        {' · '}{new Date(ref.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[ref.status]}`}>
                      {ref.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
