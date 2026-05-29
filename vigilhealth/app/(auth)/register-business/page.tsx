'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', companyName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) e.password = 'Password must contain an uppercase letter';
    if (!/[0-9]/.test(form.password)) e.password = 'Password must contain a number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    const supabase = createClient();

    // Register with Supabase Auth — stores in auth.users (not public.users)
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          company_name: form.companyName.trim(),
          account_type: 'business',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/business/onboarding`,
      },
    });

    if (error) {
      setErrors({ general: error.message });
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      // Email verification required — redirect to verify page
      // After verification, auth callback will redirect to /business/onboarding
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}&next=/business/onboarding&type=business`);
      return;
    }

    if (data.session) {
      // Auto-confirmed (e.g. dev mode) — go straight to onboarding
      router.push('/business/onboarding');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🏢</span>
        <h2 className="text-xl font-semibold text-gray-900">Create Business Account</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Set up your business account and start monitoring employee wellness
      </p>

      {errors.general && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            id="companyName"
            type="text"
            value={form.companyName}
            onChange={(e) => setForm(p => ({ ...p, companyName: e.target.value }))}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyName ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Acme Corp"
          />
          {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Work Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="you@company.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Min. 8 chars, uppercase, number"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="Re-enter password"
          />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating account…' : 'Create Business Account →'}
        </button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
        </p>
        <p>
          Individual user?{' '}
          <Link href="/register" className="font-medium text-gray-600 hover:text-gray-800">Personal account</Link>
        </p>
      </div>
    </div>
  );
}
