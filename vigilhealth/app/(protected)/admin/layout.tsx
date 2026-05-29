'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check admin role from user metadata
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const role = data.user?.app_metadata?.role;
      if (role === 'admin' || role === 'superadmin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.replace('/');
      }
    });
  }, [user, router]);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin nav */}
      <nav className="bg-gray-900 text-white px-4 py-3">
        <div className="mx-auto max-w-5xl flex items-center gap-6">
          <span className="font-bold text-sm text-gray-300">⚙️ Admin</span>
          <Link href="/admin/moderation" className="text-sm hover:text-white text-gray-400">
            Moderation
          </Link>
          <Link href="/admin/safe-badges" className="text-sm hover:text-white text-gray-400">
            Safe Badges
          </Link>
          <Link href="/admin/commissions" className="text-sm hover:text-white text-gray-400">
            Commissions
          </Link>
          <Link href="/" className="ml-auto text-sm hover:text-white text-gray-400">
            ← Back to App
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
