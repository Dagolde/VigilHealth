'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { SupplyLocation } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceFilter = {
  walkIn: boolean;
  insurance: boolean;
  appointment: boolean;
  safeBadge: boolean;
};

type LocationType = 'pharmacy' | 'testing_site' | 'telehealth' | 'other';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTypeLabel(type: LocationType | null): string {
  switch (type) {
    case 'pharmacy':
      return 'Pharmacy';
    case 'testing_site':
      return 'Testing Site';
    case 'telehealth':
      return 'Telehealth';
    default:
      return 'Other';
  }
}

function getTypeColor(type: LocationType | null): string {
  switch (type) {
    case 'pharmacy':
      return 'bg-blue-100 text-blue-800';
    case 'testing_site':
      return 'bg-purple-100 text-purple-800';
    case 'telehealth':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function buildMapsUrl(address: string, provider: 'google' | 'apple'): string {
  const encoded = encodeURIComponent(address);
  if (provider === 'apple') {
    return `maps://maps.apple.com/?q=${encoded}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [locations, setLocations] = useState<SupplyLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<LocationType | 'all'>('all');
  const [filters, setFilters] = useState<ServiceFilter>({
    walkIn: false,
    insurance: false,
    appointment: false,
    safeBadge: false,
  });

  useEffect(() => {
    async function fetchLocations() {
      try {
        const supabase = createClient();
        let query = supabase
          .from('supply_locations')
          .select('*')
          .order('name', { ascending: true });

        if (filters.safeBadge) {
          query = query.eq('has_safe_badge', true);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          setError('Failed to load services directory.');
          return;
        }

        setLocations(data ?? []);
      } catch {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    void fetchLocations();
  }, [filters.safeBadge]);

  const filteredLocations = locations.filter((loc) => {
    if (typeFilter !== 'all' && loc.type !== typeFilter) return false;

    const hours = (loc.hours ?? '').toLowerCase();
    if (filters.walkIn && !hours.includes('walk')) return false;
    if (filters.appointment && !hours.includes('appt') && !hours.includes('appointment'))
      return false;

    return true;
  });

  const toggleFilter = (key: keyof ServiceFilter) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Safe Services Directory</h1>
          <p className="mt-2 text-gray-600">
            Find verified pharmacies, testing sites, and telehealth providers near you.
          </p>
        </div>

        {/* Type Filter Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'pharmacy', 'testing_site', 'telehealth', 'other'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t === 'all' ? 'All' : getTypeLabel(t)}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Filter by Service
          </h2>
          <div className="flex flex-wrap gap-4">
            {(
              [
                { key: 'walkIn', label: 'Walk-in Available' },
                { key: 'insurance', label: 'Accepts Insurance' },
                { key: 'appointment', label: 'By Appointment' },
                { key: 'safeBadge', label: 'Safe Badge Verified' },
              ] as { key: keyof ServiceFilter; label: string }[]
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters[key]}
                  onChange={() => toggleFilter(key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <span className="ml-3 text-gray-600">Loading services...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {!loading && !error && filteredLocations.length === 0 && (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 border border-gray-200">
            No services found matching your filters.
          </div>
        )}

        <div className="space-y-4">
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className="rounded-lg bg-white p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{loc.name}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getTypeColor(loc.type)}`}
                    >
                      {getTypeLabel(loc.type)}
                    </span>
                    {loc.has_safe_badge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-300">
                        ✓ Safe Badge Verified
                      </span>
                    )}
                    {loc.is_premium && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        ★ Premium
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{loc.address}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {loc.hours && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">🕐</span>
                        <span>{loc.hours}</span>
                      </div>
                    )}
                    {loc.phone && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">📞</span>
                        <a
                          href={`tel:${loc.phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {loc.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <a
                    href={buildMapsUrl(loc.address, 'google')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    <span>📍</span> Google Maps
                  </a>
                  <a
                    href={buildMapsUrl(loc.address, 'apple')}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900 transition-colors"
                  >
                    <span>🗺️</span> Apple Maps
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Showing {filteredLocations.length} of {locations.length} services
          </p>
        )}
      </div>
    </div>
  );
}
