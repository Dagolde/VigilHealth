'use client';

import { useEffect, useState } from 'react';

interface UserRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
  banned: boolean;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch('/api/superadmin/users');
    if (res.ok) {
      const data = await res.json() as { users: UserRow[] };
      setUsers(data.users ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { void fetchUsers(); }, []);

  const handleSuspend = async (userId: string, userEmail: string, suspend: boolean) => {
    const action = suspend ? 'suspend' : 'unsuspend';
    if (!confirm(`${suspend ? 'Suspend' : 'Unsuspend'} account for ${userEmail}?`)) return;
    const res = await fetch('/api/superadmin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    if (res.ok) {
      setMessage({ type: 'success', text: `Account ${action}ed: ${userEmail}` });
      void fetchUsers();
    } else {
      setMessage({ type: 'error', text: `Failed to ${action} account` });
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Manage Users</h1>
        <p className="text-gray-400 mt-1">View, search, and suspend user accounts</p>
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
          {message.text}
        </div>
      )}

      <input
        className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email..."
        type="text"
        value={search}
      />

      <div className="rounded-xl bg-gray-900 border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 animate-pulse rounded bg-gray-800" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-white">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === 'superadmin' ? 'bg-purple-900 text-purple-200' :
                      user.role === 'admin' ? 'bg-blue-900 text-blue-200' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.banned ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
                      {user.banned ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                        user.banned
                          ? 'bg-green-800 text-green-200 hover:bg-green-700'
                          : 'bg-red-800 text-red-200 hover:bg-red-700'
                      }`}
                      onClick={() => handleSuspend(user.id, user.email, !user.banned)}
                      type="button"
                    >
                      {user.banned ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <p className="p-6 text-center text-gray-500 text-sm">No users found</p>
        )}
      </div>
    </div>
  );
}
