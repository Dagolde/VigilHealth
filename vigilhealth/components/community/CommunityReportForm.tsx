'use client';

/**
 * CommunityReportForm
 *
 * Allows authenticated users to submit a community health observation report.
 * Supports browser geolocation with manual lat/lng fallback.
 */

import React, { useState } from 'react';

export interface CommunityReportFormProps {
  onSuccess?: (reportId: string) => void;
  className?: string;
}

type ObservationType = 'symptom' | 'supply' | 'other';

interface FormState {
  lat: string;
  lng: string;
  observationType: ObservationType | '';
  description: string;
}

interface FormErrors {
  lat?: string;
  lng?: string;
  observationType?: string;
  description?: string;
  general?: string;
}

const INITIAL_FORM: FormState = {
  lat: '',
  lng: '',
  observationType: '',
  description: '',
};

export function CommunityReportForm({ onSuccess, className = '' }: CommunityReportFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Geolocation ────────────────────────────────────────────────────────────

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        general: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setIsLocating(true);
    setErrors((prev) => ({ ...prev, lat: undefined, lng: undefined, general: undefined }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let message = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enter coordinates manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out.';
        }
        setErrors((prev) => ({ ...prev, general: message }));
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate(): FormErrors {
    const errs: FormErrors = {};

    const latNum = parseFloat(form.lat);
    const lngNum = parseFloat(form.lng);

    if (!form.lat.trim()) {
      errs.lat = 'Latitude is required.';
    } else if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errs.lat = 'Latitude must be between -90 and 90.';
    }

    if (!form.lng.trim()) {
      errs.lng = 'Longitude is required.';
    } else if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errs.lng = 'Longitude must be between -180 and 180.';
    }

    if (!form.observationType) {
      errs.observationType = 'Observation type is required.';
    }

    if (!form.description.trim()) {
      errs.description = 'Description is required.';
    } else if (form.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    } else if (form.description.trim().length > 500) {
      errs.description = 'Description must be 500 characters or fewer.';
    }

    return errs;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/community/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
          observationType: form.observationType,
          description: form.description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.reason ?? data.error ?? 'Failed to submit report. Please try again.';
        setErrors({ general: message });
        return;
      }

      setSuccessMessage('Your report has been submitted. Thank you for contributing!');
      setForm(INITIAL_FORM);
      onSuccess?.(data.id);
    } catch {
      setErrors({ general: 'A network error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const descriptionLength = form.description.length;

  return (
    <div className={`rounded-lg bg-white p-6 shadow ${className}`}>
      <h2 className="mb-1 text-xl font-semibold text-gray-900">Submit a Community Report</h2>
      <p className="mb-6 text-sm text-gray-500">
        Share a health observation in your area to help others stay informed.
      </p>

      {/* Success message */}
      {successMessage && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800"
        >
          {successMessage}
        </div>
      )}

      {/* General error */}
      {errors.general && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800"
        >
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Location section */}
        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-gray-700">
            Location <span className="text-red-500">*</span>
          </legend>

          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocating ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent"
                  aria-hidden="true"
                />
                Locating…
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Use my location
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="lat" className="block text-xs font-medium text-gray-600">
                Latitude
              </label>
              <input
                id="lat"
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm((prev) => ({ ...prev, lat: e.target.value }))}
                placeholder="e.g. 37.7749"
                aria-describedby={errors.lat ? 'lat-error' : undefined}
                aria-invalid={!!errors.lat}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.lat
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.lat && (
                <p id="lat-error" className="mt-1 text-xs text-red-600">
                  {errors.lat}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lng" className="block text-xs font-medium text-gray-600">
                Longitude
              </label>
              <input
                id="lng"
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm((prev) => ({ ...prev, lng: e.target.value }))}
                placeholder="e.g. -122.4194"
                aria-describedby={errors.lng ? 'lng-error' : undefined}
                aria-invalid={!!errors.lng}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                  errors.lng
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.lng && (
                <p id="lng-error" className="mt-1 text-xs text-red-600">
                  {errors.lng}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Observation type */}
        <div>
          <label htmlFor="observationType" className="block text-sm font-medium text-gray-700">
            Observation Type <span className="text-red-500">*</span>
          </label>
          <select
            id="observationType"
            value={form.observationType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, observationType: e.target.value as ObservationType | '' }))
            }
            aria-describedby={errors.observationType ? 'obs-type-error' : undefined}
            aria-invalid={!!errors.observationType}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              errors.observationType
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          >
            <option value="">Select a type…</option>
            <option value="symptom">Symptom observation</option>
            <option value="supply">Supply availability</option>
            <option value="other">Other</option>
          </select>
          {errors.observationType && (
            <p id="obs-type-error" className="mt-1 text-xs text-red-600">
              {errors.observationType}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what you observed (10–500 characters)…"
            maxLength={500}
            aria-describedby={
              errors.description ? 'desc-error' : 'desc-hint'
            }
            aria-invalid={!!errors.description}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              errors.description
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          <div className="mt-1 flex items-start justify-between">
            {errors.description ? (
              <p id="desc-error" className="text-xs text-red-600">
                {errors.description}
              </p>
            ) : (
              <p id="desc-hint" className="text-xs text-gray-500">
                Minimum 10 characters
              </p>
            )}
            <span
              className={`text-xs ${descriptionLength > 480 ? 'text-amber-600' : 'text-gray-400'}`}
              aria-live="polite"
            >
              {descriptionLength}/500
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
