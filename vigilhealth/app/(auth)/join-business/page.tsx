'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface OrgInfo {
  name: string;
  id: string;
}

function JoinBusinessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get('org');

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    fetch(`/api/business/join?org=${encodeURIComponent(orgId)}`)
      .then((r) => r.json())
      .then((data: { org?: OrgInfo; error?: string }) => {
        if (data.error || !data.org) {
          setError(data.error ?? 'Organization not found');
        } else {
          setOrg(data.org);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load organization info');
        setLoading(false);
      });
  }, [orgId]);

  const handleJoin = async () => {
    if (!orgId) return;
    setJoining(true);
    setError(null);

    try {
      const res = await fetch('/api/business/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Failed to join organization');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/business/dashboard'), 2000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 p-8 text-center shadow-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Invalid Invite Link</h2>
        <p className="text-sm text-gray-500">
          This invite link is missing the organization ID. Please ask your admin for a new link.
        </p>
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-8 text-center">
        <div className="text-4xl mb-3">❌</div>
        <h2 className="text-lg font-semibold text-red-800 mb-1">Organization Not Found</h2>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-semibold text-green-800 mb-1">You&apos;ve Joined!</h2>
        <p className="text-sm text-green-600">
          Welcome to {org?.name}. Redirecting to your dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🏢</div>
        <h2 className="text-xl font-bold text-gray-900">Join Organization</h2>
        <p className="text-gray-500 mt-1 text-sm">You&apos;ve been invited to join:</p>
        <p className="text-lg font-semibold text-blue-700 mt-2">{org?.name}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={() => void handleJoin()}
        disabled={joining}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {joining ? 'Joining…' : 'Join Organization →'}
      </button>

      <p className="text-xs text-gray-400 text-center mt-4">
        You must be signed in to join. If you don&apos;t have an account,{' '}
        <a href="/register" className="text-blue-600 hover:underline">
          create one first
        </a>
        .
      </p>
    </div>
  );
}

export default function JoinBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      }
    >
      <JoinBusinessContent />
    </Suspense>
  );
}
