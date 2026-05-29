import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "You're Offline — VigilHealth",
  description: 'No internet connection. Some features may be unavailable.',
};

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
    >
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-6" aria-hidden="true">
          📡
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re offline</h1>
        <p className="text-gray-600 mb-6">
          No internet connection detected. You can still view previously loaded risk data and supply
          locations. Any actions you take (help requests, supply reports) will be synced when you
          reconnect.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/risk-radar"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
          >
            View Cached Risk Data
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-brand-700 bg-white rounded-lg border-2 border-brand-200 hover:bg-brand-50 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
