import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VigilHealth — Hyperlocal Health Intelligence',
  description:
    'Real-time community health risk mapping, symptom checking, supply finding, and mutual aid coordination for your neighborhood.',
};

export default function HomePage() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col">

      {/* ── Navigation Bar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-green-700">
            <span className="text-2xl">🏥</span>
            VigilHealth
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/risk-radar" className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Risk Radar</Link>
            <Link href="/symptom-checker" className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Symptoms</Link>
            <Link href="/supply-finder" className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Supply Finder</Link>
            <Link href="/community" className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">Community</Link>
            <Link href="/for-business" className="px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">For Business</Link>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Link href="/login-business" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              Business Login
            </Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors hidden sm:inline-flex">
              Log in
            </Link>
            <Link href="/register-business" className="px-4 py-2 text-sm font-medium text-blue-700 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors hidden sm:inline-flex">
              Business
            </Link>
            <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-4 py-24 text-center bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium text-green-700 bg-green-100 rounded-full border border-green-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
            </span>
            Live community health data
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Your neighborhood&apos;s{' '}
            <span className="text-green-600">health intelligence</span> platform
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Real-time risk mapping, symptom checking, supply finding, and
            community mutual aid — all in one place. Stay informed, stay safe.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Get started free →
            </Link>
            <Link
              href="/risk-radar"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-green-700 bg-white rounded-lg border-2 border-green-200 hover:bg-green-50 transition-colors"
            >
              View Risk Radar
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-400">No credit card required · Free forever for individuals</p>
        </div>
      </section>

      {/* ── Feature Grid ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything you need to stay healthy
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            VigilHealth combines official WHO and CDC data with community-sourced
            reports to give you the most accurate local health picture.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group flex flex-col p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-2xl ${feature.iconBg}`} aria-hidden="true">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 flex-1">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business CTA ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium text-blue-300 bg-blue-900/50 rounded-full border border-blue-700">
            🏢 For Businesses
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Protect your workforce with real-time health intelligence
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Monitor employee wellness, detect outbreak patterns early, and keep your team safe.
            Premium listings, Safe Badge certification, and B2B dashboards available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/for-business"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Learn more for business →
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-gray-300 bg-gray-800 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              Create business account
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg mx-auto text-center">
            {[
              { value: '$29/mo', label: 'Premium Listing' },
              { value: '$49/mo', label: 'Safe Badge' },
              { value: '$99/mo', label: 'B2B Dashboard' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Risk Level Legend ──────────────────────────────────────── */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Understanding Risk Levels</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {riskLevels.map((level) => (
              <div
                key={level.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
                style={{ backgroundColor: level.bgColor, borderColor: level.borderColor, color: level.textColor }}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: level.dotColor }} aria-hidden="true" />
                {level.label}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Risk levels are calculated from WHO/CDC data and community reports. Updated daily.
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2025 VigilHealth. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/for-business" className="hover:text-gray-900">For Business</Link>
            <Link href="/register" className="hover:text-gray-900">Sign Up</Link>
            <Link href="/login" className="hover:text-gray-900">Log In</Link>
            <Link href="/login-admin" className="hover:text-gray-900 text-purple-500">Admin</Link>
          </div>
          <p className="w-full text-xs text-gray-400">
            VigilHealth provides health information for educational purposes only — not medical advice.
          </p>
        </div>
      </footer>
    </main>
  );
}

const features = [
  { href: '/risk-radar', icon: '🗺️', iconBg: 'bg-blue-100', title: 'Risk Radar', description: 'Interactive map showing real-time health risk levels for your neighborhood, powered by WHO and CDC data.' },
  { href: '/symptom-checker', icon: '🩺', iconBg: 'bg-green-100', title: 'Symptom Checker', description: 'Match your symptoms against current outbreak profiles and get guidance on next steps — including telehealth referrals.' },
  { href: '/supply-finder', icon: '🏥', iconBg: 'bg-purple-100', title: 'Supply Finder', description: 'Find pharmacies, testing sites, and health supplies near you with real-time availability reported by the community.' },
  { href: '/alerts', icon: '🔔', iconBg: 'bg-yellow-100', title: 'Alert System', description: 'Get personalized daily digests and immediate push notifications when critical health risks emerge in your area.' },
  { href: '/community', icon: '🤝', iconBg: 'bg-orange-100', title: 'Community Network', description: 'Request help from verified neighbors for essential tasks, or volunteer to assist those in need during health crises.' },
  { href: '/qa', icon: '💬', iconBg: 'bg-teal-100', title: 'Community Q&A', description: 'Get answers to health questions backed by verified sources from WHO, CDC, and other authoritative organizations.' },
];

const riskLevels = [
  { label: 'Low Risk', bgColor: '#f0fdf4', borderColor: '#bbf7d0', textColor: '#166534', dotColor: '#10b981' },
  { label: 'Moderate Risk', bgColor: '#fffbeb', borderColor: '#fde68a', textColor: '#92400e', dotColor: '#f59e0b' },
  { label: 'High Risk', bgColor: '#fef2f2', borderColor: '#fecaca', textColor: '#991b1b', dotColor: '#ef4444' },
  { label: 'Critical Risk', bgColor: '#450a0a', borderColor: '#7f1d1d', textColor: '#fef2f2', dotColor: '#7f1d1d' },
];
