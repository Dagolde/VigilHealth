'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        aria-label="Loading"
        role="status"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!user) {
    // Render nothing while redirect is in progress
    return null;
  }

  return <>{children}</>;
}
