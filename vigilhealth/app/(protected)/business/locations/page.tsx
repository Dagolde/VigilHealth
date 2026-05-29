'use client';

import { useEffect, useState } from 'react';

interface BusinessLocation {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  employeeCount: number;
}

interface LocationsResponse {
  locations?: BusinessLocation[];
  error?: string;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/business/locations')
      .then((r) => r.json())
      .then((data: LocationsResponse) => {
        if (data.error) {
          setError(data.error);
        } else {
          setLocations(data.locations ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load locations');
        setLoading(false);
      });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!name.trim()) {
      setAddError('Location name is required');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/business/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
      });
      const data = (await res.json()) as { location?: BusinessLocation; error?: string };

      if (!res.ok) {
        setAddError(data.error ?? 'Failed to add location');
      } else if (data.location) {
        setLocations((prev) => [...prev, data.location!]);
        setName('');
        setAddress('');
      }
    } catch {
      setAddError('An unexpected error occurred');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location? This cannot be undone.')) return;
    setRemoving(id);
    try {
      const res = await fetch('/api/business/locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        alert(data.error ?? 'Failed to delete location');
      } else {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Locations</h1>
        <p className="text-gray-500 mt-1">Manage your organization&apos;s physical locations.</p>
      </div>

      {/* Add Location Form */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Location</h2>

        {addError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {addError}
          </div>
        )}

        <form onSubmit={(e) => void handleAdd(e)} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Office, Warehouse A"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {adding ? 'Adding…' : '+ Add Location'}
          </button>
        </form>
      </div>

      {/* Locations List */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            All Locations
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {locations.length}
            </span>
          </h2>
        </div>

        {locations.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            <div className="text-4xl mb-2">📍</div>
            <p>No locations yet. Add your first location above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl shrink-0">
                    📍
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{loc.name}</p>
                    {loc.address && (
                      <p className="text-xs text-gray-500 truncate">{loc.address}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Added {new Date(loc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">{loc.employeeCount}</p>
                    <p className="text-xs text-gray-400">reports</p>
                  </div>
                  <button
                    onClick={() => void handleDelete(loc.id)}
                    disabled={removing === loc.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {removing === loc.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
