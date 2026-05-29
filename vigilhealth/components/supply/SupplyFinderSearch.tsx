'use client';

import { useCallback, useState } from 'react';

import { AvailabilityReportForm } from '@/components/supply/AvailabilityReportForm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplySearchResultItem {
  id: string;
  name: string;
  type: 'pharmacy' | 'testing_site' | 'telehealth' | 'other';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  lastUpdated: string;
  /** Timestamp of the most recent crowdsourced availability report, if any */
  latestReportAt?: string;
  isPremium: boolean;
  hasSafeBadge: boolean;
  isOutdated: boolean;
  hours: string;
  contact: string;
}

interface SupplySearchResponse {
  results: SupplySearchResultItem[];
  total: number;
}

interface FilterState {
  inStock: boolean;
  safeBadge: boolean;
  premium: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABILITY_LABELS: Record<SupplySearchResultItem['availability'], string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  unknown: 'Unknown',
};

const AVAILABILITY_COLORS: Record<SupplySearchResultItem['availability'], string> = {
  in_stock: 'bg-emerald-100 text-emerald-800',
  low_stock: 'bg-amber-100 text-amber-800',
  out_of_stock: 'bg-red-100 text-red-800',
  unknown: 'bg-gray-100 text-gray-600',
};

const TYPE_LABELS: Record<SupplySearchResultItem['type'], string> = {
  pharmacy: 'Pharmacy',
  testing_site: 'Testing Site',
  telehealth: 'Telehealth',
  other: 'Other',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvailabilityBadge({ status }: { status: SupplySearchResultItem['availability'] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${AVAILABILITY_COLORS[status]}`}
    >
      {AVAILABILITY_LABELS[status]}
    </span>
  );
}

function OutdatedWarning() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
      Data may be outdated (&gt;24h)
    </span>
  );
}

function ResultCard({ result, searchItem }: { result: SupplySearchResultItem; searchItem: string }) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [latestReportAt, setLatestReportAt] = useState<string | undefined>(result.latestReportAt);

  const formattedDate = new Date(result.lastUpdated).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedReportDate = latestReportAt
    ? new Date(latestReportAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(result.location.address)}`;

  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        result.isPremium ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900">{result.name}</h3>
            {result.isPremium && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                ★ Premium
              </span>
            )}
            {result.hasSafeBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                <svg
                  aria-hidden="true"
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                    fillRule="evenodd"
                  />
                </svg>
                Safe Badge
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{TYPE_LABELS[result.type]}</p>
        </div>

        <AvailabilityBadge status={result.availability} />
      </div>

      {/* Address & distance */}
      <p className="mt-2 text-sm text-gray-600">{result.location.address}</p>
      <p className="text-sm font-medium text-gray-700">{result.distance} mi away</p>

      {/* Hours & contact */}
      {result.hours && (
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-medium">Hours:</span> {result.hours}
        </p>
      )}
      {result.contact && (
        <p className="mt-0.5 text-sm text-gray-600">
          <span className="font-medium">Contact:</span>{' '}
          <a className="text-blue-600 hover:underline" href={`tel:${result.contact}`}>
            {result.contact}
          </a>
        </p>
      )}

      {/* Footer: timestamp + outdated warning + directions */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-400">Updated {formattedDate}</span>
          {formattedReportDate && (
            <span className="text-xs text-blue-600">
              Community report: {formattedReportDate}
            </span>
          )}
          {result.isOutdated && <OutdatedWarning />}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            onClick={() => setShowReportForm(true)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Report availability
          </button>

          <a
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            href={mapsUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
              <path
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Directions
          </a>
        </div>
      </div>

      {/* Availability report modal */}
      {showReportForm && (
        <AvailabilityReportForm
          itemName={searchItem}
          locationId={result.id}
          locationName={result.name}
          onClose={() => setShowReportForm(false)}
          onSuccess={(createdAt) => {
            setLatestReportAt(createdAt);
            setShowReportForm(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SupplyFinderSearchProps {
  /** Pre-populated user latitude (e.g. from profile or browser geolocation) */
  defaultLat?: number;
  /** Pre-populated user longitude */
  defaultLng?: number;
  className?: string;
}

export function SupplyFinderSearch({
  defaultLat,
  defaultLng,
  className = '',
}: SupplyFinderSearchProps) {
  // ── Form state ───────────────────────────────────────────────────────────────
  const [item, setItem] = useState('');
  const [radius, setRadius] = useState(10);
  const [lat, setLat] = useState<number | null>(defaultLat ?? null);
  const [lng, setLng] = useState<number | null>(defaultLng ?? null);
  const [filters, setFilters] = useState<FilterState>({
    inStock: false,
    safeBadge: false,
    premium: false,
  });

  // ── Search state ─────────────────────────────────────────────────────────────
  const [results, setResults] = useState<SupplySearchResultItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // ── Geolocation ──────────────────────────────────────────────────────────────
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError('Unable to retrieve your location. Please enter coordinates manually.');
        setLocating(false);
      }
    );
  }, []);

  // ── Search ───────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!item.trim()) {
        setError('Please enter an item to search for.');
        return;
      }

      if (lat === null || lng === null) {
        setError('Please provide your location before searching.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          item: item.trim(),
          lat: String(lat),
          lng: String(lng),
          radius: String(radius),
        });

        if (filters.inStock) params.set('inStock', 'true');
        if (filters.safeBadge) params.set('safeBadge', 'true');
        if (filters.premium) params.set('premium', 'true');

        const response = await fetch(`/api/supply/search?${params.toString()}`);

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? 'Search failed');
        }

        const data = (await response.json()) as SupplySearchResponse;
        setResults(data.results);
        setTotal(data.total);
      } catch (err) {
        console.error('[SupplyFinderSearch] search error:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [item, lat, lng, radius, filters]
  );

  // ── Filter toggle ────────────────────────────────────────────────────────────
  const toggleFilter = useCallback((key: keyof FilterState) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`space-y-6 ${className}`}>
      <form className="space-y-4" onSubmit={handleSearch}>
        {/* Item name */}
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="supply-item">
            Item name
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="supply-item"
            onChange={(e) => setItem(e.target.value)}
            placeholder="e.g. N95 masks, rapid test kits, hand sanitizer"
            required
            type="text"
            value={item}
          />
        </div>

        {/* Location row */}
        <div>
          <div className="flex items-center justify-between">
            <span className="block text-sm font-medium text-gray-700">Your location</span>
            <button
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:underline disabled:opacity-50"
              disabled={locating}
              onClick={handleLocate}
              type="button"
            >
              {locating ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  Locating...
                </>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                    <path
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  Use my location
                </>
              )}
            </button>
          </div>

          {lat !== null && lng !== null ? (
            <p className="mt-1 text-xs text-gray-500">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">No location set — click &quot;Use my location&quot;</p>
          )}
        </div>

        {/* Radius selector */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700" htmlFor="supply-radius">
              Search radius
            </label>
            <span className="text-sm font-semibold text-blue-600">
              {radius} {radius === 1 ? 'mile' : 'miles'}
            </span>
          </div>
          <input
            className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            id="supply-radius"
            max="50"
            min="1"
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
            step="1"
            style={{
              background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((radius - 1) / 49) * 100}%, #e5e7eb ${((radius - 1) / 49) * 100}%, #e5e7eb 100%)`,
            }}
            type="range"
            value={radius}
          />
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>1 mi</span>
            <span>25 mi</span>
            <span>50 mi</span>
          </div>
        </div>

        {/* Filter options */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Filters</p>
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                filters.inStock
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => toggleFilter('inStock')}
              type="button"
            >
              In stock only
            </button>
            <button
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                filters.safeBadge
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => toggleFilter('safeBadge')}
              type="button"
            >
              Safe Badge
            </button>
            <button
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                filters.premium
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => toggleFilter('premium')}
              type="button"
            >
              Premium only
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || !item.trim() || lat === null || lng === null}
          type="submit"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Searching...
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {total === 0
                ? 'No locations found'
                : `${total} location${total === 1 ? '' : 's'} found`}
            </h2>
            {total > 0 && (
              <span className="text-xs text-gray-500">Sorted by distance (nearest first)</span>
            )}
          </div>

          {total === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-600">
                No supply locations found within {radius} {radius === 1 ? 'mile' : 'miles'}.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Try increasing the search radius or adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} searchItem={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
