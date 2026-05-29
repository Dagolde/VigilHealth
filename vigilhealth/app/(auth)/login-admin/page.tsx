'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Invalid credentials. Access denied.');
      setLoading(false);
      return;
    }

    // Verify the user has superadmin role
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.app_metadata?.role;

    if (role !== 'superadmin') {
      // Sign them out — not a superadmin
      await supabase.auth.signOut();
      setError('Access denied. This portal is for super administrators only.');
      setLoading(false);
      return;
    }

    // Superadmin confirmed — redirect to dashboard
    router.push('/superadmin');
  };

  return (
    <div className="bg-gray-900 rounded-2xl shadow-xl border border-purple-800 p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-900 border border-purple-700 text-2xl mb-3">
          👑
        </div>
        <h2 className="text-xl font-bold text-white">Super Admin Portal</h2>
        <p className="text-sm text-gray-400 mt-1">Restricted access — authorized personnel only</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-900/50 border border-red-700 px-4 py-3 text-sm text-red-300" role="alert">
          🚫 {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Admin Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="admin@vigilhealth.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Verifying…
            </span>
          ) : (
            'Access Admin Dashboard'
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-gray-700 text-center space-y-2">
        <p className="text-xs text-gray-500">
          This portal is monitored. Unauthorized access attempts are logged.
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <Link href="/login" className="text-gray-500 hover:text-gray-300 transition-colors">
            User Login
          </Link>
          <Link href="/login-business" className="text-gray-500 hover:text-gray-300 transition-colors">
            Business Login
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-300 transition-colors">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
