'use client';

import { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BadgeApplication {
  id: string;
  locationId: string;
  locationName: string;
  protocolDescription: string;
  documentUrl: string | null;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SafeBadgesAdminPage() {
  const [applications, setApplications] = useState<BadgeApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch from a safe_badge_applications table
    // For now, show empty state
    setLoading(false);
  }, []);

  const handleApprove = async (id: string) => {
    const response = await fetch(`/api/admin/safe-badges/${id}/approve`, {
      method: 'POST',
    });

    if (response.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'approved' } : a))
      );
    } else {
      alert('Failed to approve badge application.');
    }
  };

  const handleReject = async (id: string) => {
    const response = await fetch(`/api/admin/safe-badges/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });

    if (response.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a))
      );
    } else {
      alert('Failed to reject badge application.');
    }
  };

  const pendingApplications = applications.filter((a) => a.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Safe Badge Applications</h1>
          <p className="text-gray-600 mt-1">
            Review and approve Safe Badge applications (48-hour SLA).
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : pendingApplications.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 border border-gray-200">
            No pending badge applications. ✅
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApplications.map((app) => (
              <div
                key={app.id}
                className="rounded-lg bg-white p-5 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{app.locationName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{app.protocolDescription}</p>
                    {app.documentUrl && (
                      <a
                        href={app.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        View documentation
                      </a>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted {new Date(app.submittedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => void handleApprove(app.id)}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => void handleReject(app.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
