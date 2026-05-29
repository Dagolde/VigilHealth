'use client';

import { useEffect, useState } from 'react';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  description: string;
  website: string;
  wait_time: number;
  commission_rate: number;
  languages: string[];
  available_24h: boolean;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
}

interface Referral {
  id: string;
  provider_name: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'cancelled';
  commission_amount: number | null;
  commission_paid: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  completed: number;
  pending: number;
  totalCommission: number;
  earnedCommission: number;
}

const EMPTY_FORM = { name: '', specialty: '', description: '', website: '', wait_time: 10, commission_rate: 25, languages: 'English', available_24h: true };

export default function SuperAdminTelehealthPage() {
  const [activeTab, setActiveTab] = useState<'providers' | 'referrals'>('providers');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchProviders = async () => {
    const res = await fetch('/api/superadmin/telehealth/providers');
    if (res.ok) {
      const data = await res.json() as { providers?: Provider[] };
      setProviders(data.providers ?? []);
    }
  };

  const fetchReferrals = async () => {
    const res = await fetch('/api/superadmin/telehealth');
    if (res.ok) {
      const data = await res.json() as { referrals?: Referral[]; stats?: Stats };
      setReferrals(data.referrals ?? []);
      setStats(data.stats ?? null);
    }
  };

  useEffect(() => {
    Promise.all([fetchProviders(), fetchReferrals()]).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (provider: Provider, field: 'is_active' | 'is_suspended') => {
    const res = await fetch('/api/superadmin/telehealth/providers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: provider.id, [field]: !provider[field] }),
    });
    if (res.ok) {
      setMessage({ type: 'success', text: `Provider ${field === 'is_suspended' ? (!provider.is_suspended ? 'suspended' : 'unsuspended') : (!provider.is_active ? 'activated' : 'deactivated')}` });
      void fetchProviders();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch('/api/superadmin/telehealth/providers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage({ type: 'success', text: `"${name}" deleted` });
      void fetchProviders();
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/superadmin/telehealth/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
      }),
    });
    const data = await res.json() as { error?: string };
    if (res.ok) {
      setMessage({ type: 'success', text: 'Provider added successfully' });
      setShowAddForm(false);
      setForm(EMPTY_FORM);
      void fetchProviders();
    } else {
      setMessage({ type: 'error', text: data.error ?? 'Failed to add provider' });
    }
    setSaving(false);
  };

  const handleMarkPaid = async (id: string) => {
    const res = await fetch('/api/superadmin/telehealth', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, commission_paid: true }),
    });
    if (res.ok) { setMessage({ type: 'success', text: 'Commission marked as paid' }); void fetchReferrals(); }
  };

  const statusColors = { pending: 'bg-amber-100 text-amber-800', completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Telehealth Management</h1>
          <p className="text-gray-400 mt-1">Manage providers and track referral commissions.</p>
        </div>
        {activeTab === 'providers' && (
          <button onClick={() => setShowAddForm(!showAddForm)} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors" type="button">
            + Add Provider
          </button>
        )}
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {message.text} <button className="ml-3 underline" onClick={() => setMessage(null)} type="button">dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {(['providers', 'referrals'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-purple-500 text-purple-300' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
            {tab === 'referrals' ? 'Referrals & Commissions' : 'Providers'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-600 border-t-purple-500" /></div>
      ) : activeTab === 'providers' ? (
        <div className="space-y-4">
          {/* Add form */}
          {showAddForm && (
            <div className="rounded-xl bg-gray-900 border border-purple-700 p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Add New Telehealth Provider</h2>
              <form onSubmit={e => void handleAdd(e)} className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: 'name', label: 'Provider Name *', placeholder: 'e.g. Teladoc Health' },
                  { key: 'specialty', label: 'Specialty *', placeholder: 'e.g. General Medicine, Mental Health' },
                  { key: 'website', label: 'Website *', placeholder: 'https://...' },
                  { key: 'languages', label: 'Languages (comma-separated)', placeholder: 'English, Spanish' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={form[field.key as keyof typeof form] as string}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required={field.label.includes('*')}
                    />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Wait Time (minutes)</label>
                  <input type="number" value={form.wait_time} onChange={e => setForm(p => ({ ...p, wait_time: Number(e.target.value) }))} className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Commission Rate ($)</label>
                  <input type="number" step="0.01" value={form.commission_rate} onChange={e => setForm(p => ({ ...p, commission_rate: Number(e.target.value) }))} className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="sm:col-span-2 flex gap-3">
                  <button type="submit" disabled={saving} className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
                    {saving ? 'Adding…' : 'Add Provider'}
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="rounded-lg bg-gray-700 px-5 py-2 text-sm text-gray-300 hover:bg-gray-600">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Providers list */}
          <div className="rounded-xl bg-gray-900 border border-gray-700 overflow-hidden">
            {providers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No providers yet. Add one above.</div>
            ) : (
              <ul className="divide-y divide-gray-800">
                {providers.map(p => (
                  <li key={p.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-semibold text-white">{p.name}</p>
                          {p.is_suspended && <span className="rounded-full bg-red-900 px-2 py-0.5 text-xs text-red-200">Suspended</span>}
                          {!p.is_active && !p.is_suspended && <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-300">Inactive</span>}
                          {p.is_active && !p.is_suspended && <span className="rounded-full bg-green-900 px-2 py-0.5 text-xs text-green-200">Active</span>}
                        </div>
                        <p className="text-xs text-gray-400">{p.specialty}</p>
                        <p className="text-xs text-gray-500 mt-0.5">~{p.wait_time} min wait · ${p.commission_rate} commission · {p.languages.join(', ')}</p>
                        <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">{p.website}</a>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => void handleToggle(p, 'is_suspended')}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${p.is_suspended ? 'bg-green-800 text-green-200 hover:bg-green-700' : 'bg-amber-800 text-amber-200 hover:bg-amber-700'}`}
                          type="button"
                        >
                          {p.is_suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => void handleToggle(p, 'is_active')}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${p.is_active ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-blue-800 text-blue-200 hover:bg-blue-700'}`}
                          type="button"
                        >
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => void handleDelete(p.id, p.name)} className="rounded px-2 py-1 text-xs bg-red-900 text-red-300 hover:bg-red-800" type="button">Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* Referrals tab */
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                { label: 'Total', value: stats.total, color: 'border-blue-700' },
                { label: 'Completed', value: stats.completed, color: 'border-green-700' },
                { label: 'Pending', value: stats.pending, color: 'border-amber-700' },
                { label: 'Total Commission', value: `$${stats.totalCommission.toFixed(0)}`, color: 'border-purple-700' },
                { label: 'Earned', value: `$${stats.earnedCommission.toFixed(0)}`, color: 'border-emerald-700' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl bg-gray-900 border ${s.color} p-4 text-center`}>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl bg-gray-900 border border-gray-700 overflow-hidden">
            {referrals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No referrals yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Provider</th>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Commission</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {referrals.map(ref => (
                    <tr key={ref.id} className="hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-white">{ref.provider_name}</td>
                      <td className="px-4 py-3"><code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">{ref.referral_code}</code></td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[ref.status]}`}>{ref.status}</span></td>
                      <td className="px-4 py-3">
                        <p className="text-white">${(ref.commission_amount ?? 0).toFixed(0)}</p>
                        {ref.commission_paid ? <span className="text-xs text-green-400">✓ Paid</span> : ref.status === 'completed' ? <span className="text-xs text-amber-400">Unpaid</span> : null}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(ref.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {ref.status === 'completed' && !ref.commission_paid && (
                          <button onClick={() => void handleMarkPaid(ref.id)} className="rounded px-2 py-1 text-xs bg-green-800 text-green-200 hover:bg-green-700" type="button">Mark Paid</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
