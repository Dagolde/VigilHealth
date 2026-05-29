'use client';

/**
 * AvailabilityReportForm
 *
 * Modal form that lets authenticated users report the availability of a
 * specific item at a supply location. Submits to POST /api/supply/availability.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface AvailabilityReportFormProps {
  /** UUID of the supply location being reported */
  locationId: string;
  /** Human-readable name of the location (shown in the modal header) */
  locationName: string;
  /** Pre-filled item name from the search query */
  itemName: string;
  /** Called when the modal should close (cancel or after success) */
  onClose: () => void;
  /** Called after a successful submission with the new report timestamp */
  onSuccess: (createdAt: string) => void;
}

const STATUS_OPTIONS: { value: AvailabilityStatus; label: string; color: string }[] = [
  { value: 'in_stock', label: 'In Stock', color: 'text-emerald-700' },
  { value: 'low_stock', label: 'Low Stock', color: 'text-amber-700' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'text-red-700' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AvailabilityReportForm({
  locationId,
  locationName,
  itemName,
  onClose,
  onSuccess,
}: AvailabilityReportFormProps) {
  const [item, setItem] = useState(itemName);
  const [status, setStatus] = useState<AvailabilityStatus>('in_stock');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus trap: keep focus inside the modal
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFocusableRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!item.trim()) {
        setError('Item name is required.');
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch('/api/supply/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationId,
            itemName: item.trim(),
            status,
          }),
        });

        const data = (await response.json()) as { id?: string; createdAt?: string; error?: string };

        if (!response.ok) {
          if (response.status === 401) {
            setError('You must be signed in to report availability.');
          } else {
            setError(data.error ?? 'Failed to submit report. Please try again.');
          }
          return;
        }

        onSuccess(data.createdAt ?? new Date().toISOString());
      } catch {
        setError('A network error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [locationId, item, status, onSuccess]
  );

  return (
    /* Backdrop */
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-labelledby="availability-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2
              id="availability-modal-title"
              className="text-base font-semibold text-gray-900"
            >
              Report Availability
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">{locationName}</p>
          </div>
          <button
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3" role="alert">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Item name */}
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="avail-item-name">
              Item
            </label>
            <input
              ref={firstFocusableRef}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              id="avail-item-name"
              maxLength={200}
              onChange={(e) => setItem(e.target.value)}
              placeholder="e.g. N95 masks"
              required
              type="text"
              value={item}
            />
          </div>

          {/* Status selector */}
          <div>
            <span className="block text-sm font-medium text-gray-700">Availability status</span>
            <div className="mt-2 space-y-2">
              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    status === opt.value
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    checked={status === opt.value}
                    className="h-4 w-4 accent-blue-600"
                    name="availability-status"
                    onChange={() => setStatus(opt.value)}
                    type="radio"
                    value={opt.value}
                  />
                  <span className={`text-sm font-medium ${opt.color}`}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || !item.trim()}
              type="submit"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting…
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
