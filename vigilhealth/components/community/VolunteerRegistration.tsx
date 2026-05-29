'use client';

import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

// ─── Component ────────────────────────────────────────────────────────────────

export function VolunteerRegistration() {
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !phone.trim()) {
      setError('Email and phone number are required.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to register as a volunteer.');
        return;
      }

      // Create or update volunteer record
      const { error: upsertError } = await supabase
        .from('volunteers')
        .upsert({
          id: user.id,
          is_verified: false,
          verification_method: 'email_phone',
          completed_tasks: 0,
          flag_count: 0,
          is_suspended: false,
        });

      if (upsertError) {
        setError('Failed to register as volunteer. Please try again.');
        return;
      }

      // In production, send a verification code via SMS/email
      // For now, simulate by moving to verify step
      setStep('verify');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Session expired. Please log in again.');
        return;
      }

      // In production, validate the code against what was sent
      // For demo: accept any 6-digit code
      if (!/^\d{6}$/.test(verificationCode)) {
        setError('Please enter a valid 6-digit verification code.');
        return;
      }

      const { error: updateError } = await supabase
        .from('volunteers')
        .update({ is_verified: true })
        .eq('id', user.id);

      if (updateError) {
        setError('Verification failed. Please try again.');
        return;
      }

      setIsVerified(true);
      setStep('done');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center border border-green-200">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="text-lg font-semibold text-green-800">
          {isVerified ? 'Verified Volunteer!' : 'Registration Complete'}
        </h3>
        <p className="text-green-700 mt-1">
          You are now registered as a volunteer and can accept help requests.
        </p>
        {isVerified && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 border border-emerald-300">
            ✓ Verified Volunteer
          </div>
        )}
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
          <p className="text-sm text-blue-800">
            A verification code has been sent to <strong>{email}</strong> and <strong>{phone}</strong>.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Verifying...' : 'Verify & Complete Registration'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Become a Volunteer</h2>
        <p className="text-sm text-gray-600">
          Help your community by accepting nearby help requests.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Registering...' : 'Register as Volunteer'}
      </button>
    </form>
  );
}
