'use client';

import { useEffect, useState } from 'react';

interface BusinessOrg {
  id: string;
  name: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  subscription_expires_at: string | null;
  created_at: string;
  location_count: number;
  member_count: number;
}

const TIER_COLORS: Record<string, string> = {
  free: 'bg-gray-700 text-gray-200',
  basic: 'bg-blue-900 text-blue-200',
  premium: 'bg-purple-900 text-purple-200',
};

export default function ManageBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTier, setEditTier] = useState<'free' | 'basic' | 'premium'>('free');

  const fetchBusinesses = async () => {
    setLoading(true);
    const res = await fetch('/api/superadmin/businesses');
    if (res.ok) {
      const data = await res.json() as { businesses: BusinessOrg[] };
      setBusinesses(data.businesses ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { void fetchBusinesses(); }, []);

  const handleUpdateTier = async (id: string, name: string) => {
    const res = await fetch('/api/superadmin/businesses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, subscription_tier: editTier }),
    });
    const data = await res.json() as { error?: string; message?: string };
    if (res.ok) {
      setMessage({ type: 'success', text: `${name} updated to ${editTier}` });
      setEditingId(null);
      void fetchBusinesses();
    } else {
      setMessage({ type: 'error', text: data.error ?? 'Failed to update' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch('/api/superadmin/businesses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage({ type: 'success', text: `"${name}" deleted` });
      void fetchBusinesses();
    } else {
      setMessage({ type: 'error', text: 'Failed to delete business' });
    }
  };

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Businesses</h1>
        <p className="text-gray-400 mt-1">View, update subscriptions, and manage business accounts</p>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {message.text}
          <button className="ml-3 underline" onClick={() => setMessage(null)} type="button">dismiss</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Businesses', value: businesses.length },
          { label: 'Premium', value: businesses.filter(b => b.subscription_tier === 'premium').length },
          { label: 'Free Tier', value: businesses.filter(b => b.subscription_tier === 'free').length },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl bg-gray-900 border border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by business name..."
        type="text"
        value={search}
      />

      {/* Table */}
      <div className="rounded-xl bg-gray-900 border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded bg-gray-800" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-gray-500 text-sm">No businesses found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Business</th>
                <th className="px-4 py-3 text-left">Tier</th>
                <th className="px-4 py-3 text-left">Expires</th>
                <th className="px-4 py-3 text-left">Locations</th>
                <th className="px-4 py-3 text-left">Members</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((biz) => (
                <tr key={biz.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{biz.name}</p>
                    <p className="text-xs text-gray-500">Since {new Date(biz.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === biz.id ? (
                      <select
                        className="rounded bg-gray-700 border border-gray-600 px-2 py-1 text-xs text-white focus:outline-none"
                        onChange={(e) => setEditTier(e.target.value as 'free' | 'basic' | 'premium')}
                        value={editTier}
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="premium">Premium</option>
                      </select>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TIER_COLORS[biz.subscription_tier]}`}>
                        {biz.subscription_tier}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {biz.subscription_expires_at
                      ? new Date(biz.subscription_expires_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{biz.location_count}</td>
                  <td className="px-4 py-3 text-gray-300">{biz.member_count}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === biz.id ? (
                        <>
                          <button
                            className="rounded px-2 py-1 text-xs bg-green-800 text-green-200 hover:bg-green-700"
                            onClick={() => handleUpdateTier(biz.id, biz.name)}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="rounded px-2 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
                            onClick={() => setEditingId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="rounded px-2 py-1 text-xs bg-blue-800 text-blue-200 hover:bg-blue-700"
                            onClick={() => { setEditingId(biz.id); setEditTier(biz.subscription_tier); }}
                            type="button"
                          >
                            Edit Tier
                          </button>
                          <button
                            className="rounded px-2 py-1 text-xs bg-red-900 text-red-300 hover:bg-red-800"
                            onClick={() => handleDelete(biz.id, biz.name)}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
