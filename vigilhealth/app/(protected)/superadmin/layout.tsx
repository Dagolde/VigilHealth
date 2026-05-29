'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const role = data.user?.app_metadata?.role;
      if (role === 'superadmin') {
        setIsSuperAdmin(true);
      } else {
        setIsSuperAdmin(false);
        router.replace('/');
      }
    });
  }, [user, router]);

  if (isSuperAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600" />
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Super Admin nav */}
      <nav className="bg-purple-900 text-white px-4 py-3 border-b border-purple-700">
        <div className="mx-auto max-w-6xl flex items-center gap-1 flex-wrap">
          <span className="font-bold text-sm text-purple-200 mr-4">👑 Super Admin</span>
          {[
            { href: '/superadmin', label: 'Dashboard' },
            { href: '/superadmin/users', label: 'Users' },
            { href: '/superadmin/admins', label: 'Manage Admins' },
            { href: '/superadmin/businesses', label: 'Businesses' },
            { href: '/superadmin/telehealth', label: 'Telehealth' },
            { href: '/superadmin/analytics', label: 'Analytics' },
            { href: '/superadmin/system', label: 'System' },
            { href: '/admin/moderation', label: 'Moderation' },
            { href: '/admin/safe-badges', label: 'Safe Badges' },
            { href: '/admin/commissions', label: 'Commissions' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded text-sm text-purple-200 hover:bg-purple-800 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/" className="ml-auto text-sm text-purple-300 hover:text-white">
            ← App
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
