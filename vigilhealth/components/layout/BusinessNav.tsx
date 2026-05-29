'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';

const BUSINESS_NAV = [
  { href: '/business/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/business/staff', label: 'Staff', icon: '👥' },
  { href: '/business/wellness', label: 'Wellness', icon: '🩺' },
  { href: '/business/locations', label: 'Locations', icon: '📍' },
  { href: '/business/safe-badge', label: 'Safe Badge', icon: '🛡️' },
  { href: '/business/subscription', label: 'Subscription', icon: '💳' },
];

export function BusinessNav({ orgName }: { orgName?: string }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/for-business');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo + org name */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/business/dashboard" className="flex items-center gap-2 font-bold text-blue-700">
              <span className="text-xl">🏢</span>
              <span className="hidden sm:inline">VigilHealth Business</span>
            </Link>
            {orgName && (
              <>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span className="text-sm font-medium text-gray-600 hidden sm:inline truncate max-w-32">{orgName}</span>
              </>
            )}
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {BUSINESS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                  {user?.email?.[0]?.toUpperCase() ?? 'B'}
                </span>
                <span className="hidden sm:inline max-w-24 truncate">{user?.email?.split('@')[0]}</span>
                <span className="text-gray-400">▾</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-xl bg-white border border-gray-200 shadow-lg py-1 z-50">
                  <Link href="/business/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                    📊 Business Dashboard
                  </Link>
                  <Link href="/business/subscription" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                    💳 Manage Subscription
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                    👤 Personal Profile
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <Link href="/" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                    🌐 VigilHealth App
                  </Link>
                  <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
