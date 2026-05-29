'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/risk-radar', label: 'Risk Radar', icon: '🗺️' },
  { href: '/symptom-checker', label: 'Symptoms', icon: '🩺' },
  { href: '/telehealth', label: 'Telehealth', icon: '🏥' },
  { href: '/supply-finder', label: 'Supply Finder', icon: '💊' },
  { href: '/alerts', label: 'Alerts', icon: '🔔' },
  { href: '/community', label: 'Community', icon: '🤝' },
  { href: '/qa', label: 'Q&A', icon: '💬' },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function UserNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Single medical disclaimer strip */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-1 text-center text-xs text-amber-700">
        VigilHealth provides health information only — not medical advice. Always consult a licensed healthcare professional.
      </div>

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-green-700 shrink-0">
            <span className="text-xl">🏥</span>
            <span className="hidden sm:inline">VigilHealth</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* PWA Install button */}
            {installPrompt && !isInstalled && (
              <button
                onClick={() => void handleInstall()}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-300 bg-green-50 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                title="Install VigilHealth app"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install App
              </button>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                    {user.email?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                  <span className="hidden sm:inline max-w-24 truncate">{user.email?.split('@')[0]}</span>
                  <span className="text-gray-400">▾</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white border border-gray-200 shadow-lg py-1 z-50">
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      👤 My Profile
                    </Link>
                    <Link href="/alerts" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      🔔 Alert Settings
                    </Link>
                    <Link href="/business/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      🏢 Business Dashboard
                    </Link>
                    {installPrompt && !isInstalled && (
                      <button
                        onClick={() => { void handleInstall(); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                      >
                        📲 Install App
                      </button>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-2 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname.startsWith(item.href) ? 'bg-green-50 text-green-700' : 'text-gray-600'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            {installPrompt && !isInstalled && (
              <button
                onClick={() => { void handleInstall(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-green-700 bg-green-50"
              >
                📲 Install VigilHealth App
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
