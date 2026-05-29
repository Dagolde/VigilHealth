'use client';

import { useState } from 'react';

import { resetPassword } from './actions';

interface FormState {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function ResetPasswordPage() {
  const [form, setForm] = useState<FormState>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const formData = new FormData();
    formData.set('password', form.password);
    formData.set('confirmPassword', form.confirmPassword);

    const result = await resetPassword(formData);
    // If resetPassword redirects on success, this code won't run.
    setLoading(false);

    if (result?.error) {
      setErrors({
        general: result.error,
        ...result.fieldErrors,
      });
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        Set a new password
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose a strong password for your account.
      </p>

      {errors.general && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* New Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={handleChange}
            aria-describedby={
              errors.password ? 'password-error' : 'password-hint'
            }
            aria-invalid={!!errors.password}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.password
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300'
            }`}
            placeholder="Min. 8 characters"
          />
          {errors.password ? (
            <p id="password-error" className="mt-1 text-xs text-red-600">
              {errors.password}
            </p>
          ) : (
            <p id="password-hint" className="mt-1 text-xs text-gray-400">
              8+ characters, uppercase, lowercase, and a number
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            aria-describedby={
              errors.confirmPassword ? 'confirm-error' : undefined
            }
            aria-invalid={!!errors.confirmPassword}
            className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.confirmPassword
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300'
            }`}
            placeholder="Re-enter your new password"
          />
          {errors.confirmPassword && (
            <p id="confirm-error" className="mt-1 text-xs text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Updating password…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
