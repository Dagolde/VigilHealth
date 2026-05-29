'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { HelpRequest } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HelpRequestWithVolunteer extends HelpRequest {
  volunteerCompletedTasks?: number;
}

interface HelpRequestListProps {
  userLat?: number;
  userLng?: number;
  showMyRequests?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urgencyColor(urgency: string | null): string {
  switch (urgency) {
    case 'high':
      return 'bg-red-100 text-red-800';
    case 'medium':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-green-100 text-green-800';
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'accepted':
      return 'bg-blue-100 text-blue-800';
    case 'fulfilled':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HelpRequestList({ showMyRequests = false }: HelpRequestListProps) {
  const [requests, setRequests] = useState<HelpRequestWithVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      let query = supabase
        .from('help_requests')
        .select('*')
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (showMyRequests && user) {
        query = supabase
          .from('help_requests')
          .select('*')
          .eq('requester_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        setError('Failed to load help requests.');
      } else {
        setRequests(data ?? []);
      }
      setLoading(false);
    }

    void load();
  }, [supabase, showMyRequests]);

  const handleAccept = async (requestId: string) => {
    if (!currentUserId) return;

    const { error: updateError } = await supabase
      .from('help_requests')
      .update({ volunteer_id: currentUserId, status: 'accepted' })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (updateError) {
      alert('Failed to accept request. It may have already been accepted.');
      return;
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'accepted', volunteer_id: currentUserId } : r
      )
    );
  };

  const handleFulfill = async (requestId: string) => {
    const { error: updateError } = await supabase
      .from('help_requests')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateError) {
      alert('Failed to mark as fulfilled.');
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <span className="ml-2 text-gray-600">Loading requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">{error}</div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-gray-500 border border-gray-200">
        No help requests found nearby.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div
          key={req.id}
          className="rounded-lg bg-white p-5 shadow-sm border border-gray-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${urgencyColor(req.urgency)}`}
                >
                  {req.urgency ?? 'low'} urgency
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(req.status)}`}
                >
                  {req.status}
                </span>
                {req.task_type && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                    {req.task_type}
                  </span>
                )}
              </div>

              <p className="text-gray-800 text-sm">{req.description}</p>

              <p className="text-xs text-gray-500 mt-2">
                Posted {new Date(req.created_at).toLocaleDateString()}
              </p>

              {req.volunteerCompletedTasks !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Volunteer: {req.volunteerCompletedTasks} tasks completed
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {req.status === 'pending' && req.requester_id !== currentUserId && (
                <button
                  onClick={() => void handleAccept(req.id)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Accept
                </button>
              )}

              {(req.status === 'accepted' || req.status === 'pending') &&
                (req.requester_id === currentUserId || req.volunteer_id === currentUserId) && (
                  <button
                    onClick={() => void handleFulfill(req.id)}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    Mark Fulfilled
                  </button>
                )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
