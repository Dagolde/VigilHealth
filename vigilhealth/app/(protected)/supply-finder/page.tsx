'use client';

import { SupplyFinderSearch } from '@/components/supply/SupplyFinderSearch';

export default function SupplyFinderPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Supply Finder</h1>
          <p className="mt-1 text-gray-600">
            Find pharmacies, testing sites, and health supplies near you with real-time availability.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <SupplyFinderSearch />
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-4 border border-blue-100">
          <p className="text-xs text-blue-700">
            Availability data is crowdsourced by the community. Data older than 24 hours is marked as potentially outdated.
            Premium listings appear at the top of results.
          </p>
        </div>
      </div>
    </div>
  );
}
