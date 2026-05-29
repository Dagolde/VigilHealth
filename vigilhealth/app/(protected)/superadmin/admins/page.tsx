'use client';

import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    const res = await fetch('/api/superadmin/admins');
    if (res.ok) {
      const data = await res.json() as { admins: AdminUser[] };
      setAdmins(data.admins ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { void fetchAdmins(); }, []);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch('/api/superadmin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json() as { error?: string; message?: string };
    if (res.ok) {
      setMessage({ type: 'success', text: data.message ?? 'Role updated successfully' });
      setEmail('');
      void fetchAdmins();
    } else {
      setMessage({ type: 'error', text: data.error ?? 'Failed to update role' });
    }
    setSaving(false);
  };

  const handleRevoke = async (userId: string, userEmail: string) => {
    if (!confirm(`Remove admin role from ${userEmail}?`)) return;
    const res = await fetch('/api/superadmin/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMessage({ type: 'success', text: `Admin role removed from ${userEmail}` });
      void fetchAdmins();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Admins</h1>
        <p className="text-gray-400 mt-1">Promote users to admin or superadmin roles</p>
      </div>

      {/* Promote form */}
      <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Promote User</h2>
        {message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handlePromote} className="flex flex-wrap gap-3">
          <input
            className="flex-1 min-w-48 rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            type="email"
            value={email}
          />
          <select
            className="rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setRole(e.target.value as 'admin' | 'superadmin')}
            value={role}
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
          <button
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            {saving ? 'Saving...' : 'Promote'}
          </button>
        </form>
      </div>

      {/* Current admins */}
      <div className="rounded-xl bg-gray-900 border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Current Admins</h2>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded bg-gray-800" />)}
          </div>
        ) : admins.length === 0 ? (
          <p className="text-gray-500 text-sm">No admins found. Promote a user above.</p>
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{admin.email}</p>
                  <p className="text-xs text-gray-400">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      admin.role === 'superadmin' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'
                    }`}>
                      {admin.role === 'superadmin' ? '👑 Super Admin' : '🛡️ Admin'}
                    </span>
                    <span className="ml-2">Since {new Date(admin.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
                <button
                  className="rounded-lg border border-red-700 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900 hover:text-red-200 transition-colors"
                  onClick={() => handleRevoke(admin.id, admin.email)}
                  type="button"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
