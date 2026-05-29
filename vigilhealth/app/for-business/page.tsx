import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VigilHealth for Business — Employee Wellness & Health Intelligence',
  description: 'Protect your workforce with real-time health monitoring, outbreak detection, premium listings, and Safe Badge certification.',
};

export default function ForBusinessPage() {
  return (
    <main className="flex min-h-screen flex-col">

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-green-700">
            <span className="text-2xl">🏥</span>
            VigilHealth
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login-business" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              Business Login
            </Link>
            <Link href="/register-business" className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 to-gray-900 text-white px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium text-blue-300 bg-blue-800/50 rounded-full border border-blue-600">
            🏢 VigilHealth for Business
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6">
            Keep your team safe with{' '}
            <span className="text-blue-400">real-time health intelligence</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Monitor employee wellness, detect outbreak patterns before they spread,
            and show customers you take safety seriously with our Safe Badge certification.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register-business"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start free trial →
            </Link>
            <Link
              href="/business/onboarding"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-blue-300 bg-blue-900/50 rounded-lg border border-blue-600 hover:bg-blue-800/50 transition-colors"
            >
              Set up your business
            </Link>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-center text-gray-600 mb-12">Pay with card (Stripe) or mobile money / bank transfer (Paystack for Africa)</p>

          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col ${plan.featured ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                {plan.featured && (
                  <span className="inline-block mb-3 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">Most Popular</span>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">/month</span>
                  {plan.naira && <p className="text-sm text-gray-400 mt-0.5">{plan.naira} NGN/month</p>}
                </div>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register-business"
                  className={`w-full text-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything your business needs</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {bizFeatures.map((f) => (
              <div key={f.title} className="rounded-xl bg-white border border-gray-200 p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment methods */}
      <section className="py-12 px-4 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Pay your way</h2>
          <p className="text-gray-600 mb-6">
            International businesses pay via <strong>Stripe</strong> (cards, USD/EUR/GBP).
            African businesses pay via <strong>Paystack</strong> — supports NGN, GHS, KES, ZAR,
            bank transfer, USSD, and mobile money. Nigerian companies with registered accounts welcome.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {['🇳🇬 Nigeria (NGN)', '🇬🇭 Ghana (GHS)', '🇰🇪 Kenya (KES)', '🇿🇦 South Africa (ZAR)', '🌍 International (USD/EUR/GBP)'].map(c => (
              <span key={c} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to protect your workforce?</h2>
        <p className="text-blue-100 mb-8 max-w-xl mx-auto">
          Join businesses using VigilHealth to stay ahead of health risks. Set up in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register-business" className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors">
            Create free account
          </Link>
          <Link href="/business/onboarding" className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-blue-700 rounded-lg border border-blue-500 hover:bg-blue-800 transition-colors">
            Set up business →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 bg-gray-900 text-center text-sm text-gray-500">
        <p>© 2025 VigilHealth · <Link href="/" className="hover:text-gray-300">Home</Link> · <Link href="/login" className="hover:text-gray-300">Log in</Link> · <Link href="/register" className="hover:text-gray-300">Sign up</Link></p>
      </footer>
    </main>
  );
}

const plans = [
  {
    name: 'Premium Listing',
    price: '$29',
    naira: '₦46,400',
    description: 'Get your business to the top of Supply Finder results.',
    featured: false,
    features: [
      'Top placement in Supply Finder',
      'Photos and special offers',
      'Detailed business description',
      'Contact info display',
      'Renewal reminders',
    ],
  },
  {
    name: 'Safe Badge',
    price: '$49',
    naira: '₦78,400',
    description: 'Show customers you follow verified safety protocols.',
    featured: true,
    features: [
      'Verified Safe Badge on your listing',
      '30-day validity with monthly renewal',
      'Admin review within 48 hours',
      'Prominent badge display',
      'Protocol violation reporting',
      'Everything in Premium Listing',
    ],
  },
  {
    name: 'B2B Dashboard',
    price: '$99',
    naira: '₦158,400',
    description: 'Full employee wellness monitoring for your organization.',
    featured: false,
    features: [
      'Employee symptom reporting',
      'Outbreak pattern detection',
      'Sick-day trend charts',
      'Multi-location segmentation',
      'Health update broadcasts',
      'HIPAA-compliant data handling',
      'GDPR right to erasure',
      '90-day data retention',
    ],
  },
];

const bizFeatures = [
  { icon: '📊', title: 'Wellness Dashboard', description: 'Track sick-day trends daily, weekly, and monthly. Get alerted when 3+ employees report similar symptoms within 7 days.' },
  { icon: '🛡️', title: 'Safe Badge Certification', description: 'Apply for our verified Safe Badge. Customers see it prominently on your listing, building trust and driving foot traffic.' },
  { icon: '⭐', title: 'Premium Listings', description: 'Appear at the top of Supply Finder results. Add photos, special offers, and detailed descriptions to stand out.' },
  { icon: '🔒', title: 'HIPAA & GDPR Compliant', description: 'All employee health data is encrypted at rest and in transit. Employees can view and delete their own data at any time.' },
  { icon: '📍', title: 'Multi-Location Support', description: 'Manage multiple business locations from one dashboard. Segment wellness data by site to identify location-specific risks.' },
  { icon: '💳', title: 'African Payment Support', description: 'Pay via Paystack with NGN, GHS, KES, or ZAR. Supports bank transfer, USSD, and mobile money — no Stripe account needed.' },
];
