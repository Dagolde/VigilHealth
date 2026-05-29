'use client';

import { useEffect, useState } from 'react';

interface StaffMember {
  id: string;
  user_id: string | null;
  role: 'admin' | 'member';
  created_at: string;
}

interface StaffResponse {
  staff?: StaffMember[];
  orgId?: string;
  error?: string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [orgId, setOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const inviteLink =
    orgId ? `https://vigilhealth.vercel.app/join-business?org=${orgId}` : '';

  useEffect(() => {
    fetch('/api/business/staff')
      .then((r) => r.json())
      .then((data: StaffResponse) => {
        if (data.error) {
          setError(data.error);
        } else {
          setStaff(data.staff ?? []);
          setOrgId(data.orgId ?? '');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load staff');
        setLoading(false);
      });
  }, []);

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this staff member from your organization?')) return;
    setRemoving(id);
    try {
      const res = await fetch('/api/business/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? 'Failed to remove staff member');
      } else {
        setStaff((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setRemoving(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // fallback: select the input
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
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <p className="text-gray-500 mt-1">
          Manage your organization&apos;s team members and invite new staff.
        </p>
      </div>

      {/* Invite Section */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Invite Staff</h2>
        <p className="text-sm text-gray-500 mb-4">
          Share this link with your employees so they can join your organization.
        </p>
        {orgId ? (
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none"
            />
            <button
              onClick={() => void handleCopyLink()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shrink-0"
            >
              {copySuccess ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No organization ID found.</p>
        )}
      </div>

      {/* Staff List */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Team Members
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {staff.length}
            </span>
          </h2>
        </div>

        {staff.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            <div className="text-4xl mb-2">👥</div>
            <p>No staff members yet. Share the invite link above to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {staff.map((member) => (
              <li key={member.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                    {member.user_id?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user_id ?? 'Unknown user'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      member.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {member.role}
                  </span>
                  <button
                    onClick={() => void handleRemove(member.id)}
                    disabled={removing === member.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {removing === member.id ? 'Removing…' : 'Remove'}
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
