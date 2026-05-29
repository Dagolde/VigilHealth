'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function BusinessLoginPage() {
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
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Check if user has a business account
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Login failed. Please try again.'); setLoading(false); return; }

    // Check for business membership
    const { data: membership } = await supabase
      .from('business_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (membership?.organization_id) {
      // Has business — go to dashboard
      router.push('/business/dashboard');
    } else {
      // No business yet — go to onboarding
      router.push('/business/onboarding');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🏢</span>
        <h2 className="text-xl font-semibold text-gray-900">Business Sign In</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Sign in to your business account to access your dashboard
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Work Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in to Business Dashboard'}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
        <p>
          Don&apos;t have a business account?{' '}
          <Link href="/register-business" className="font-medium text-blue-600 hover:text-blue-700">
            Create one
          </Link>
        </p>
        <p>
          Individual user?{' '}
          <Link href="/login" className="font-medium text-gray-600 hover:text-gray-800">
            Personal login
          </Link>
        </p>
      </div>
    </div>
  );
}
