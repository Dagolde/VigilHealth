'use client';

import { useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedicalDisclaimerProps {
  onAcknowledge: () => void;
  onCancel: () => void;
}

// ─── Session storage key ──────────────────────────────────────────────────────

export const DISCLAIMER_SESSION_KEY = 'symptom_checker_disclaimer_ack';

/**
 * Check if the disclaimer has already been acknowledged in this session.
 */
export function isDisclaimerAcknowledged(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(DISCLAIMER_SESSION_KEY) === 'true';
}

/**
 * MedicalDisclaimer
 *
 * Modal overlay that must be acknowledged before the symptom checker can be used.
 * Stores acknowledgment in sessionStorage so it doesn't show again in the same session.
 */
export function MedicalDisclaimer({ onAcknowledge, onCancel }: MedicalDisclaimerProps) {
  // Trap focus inside modal for accessibility
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused?.focus();
    };
  }, []);

  const handleAcknowledge = () => {
    sessionStorage.setItem(DISCLAIMER_SESSION_KEY, 'true');
    onAcknowledge();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      aria-describedby="disclaimer-body"
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2
              id="disclaimer-title"
              className="text-lg font-semibold text-gray-900"
            >
              Medical Disclaimer
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p
            id="disclaimer-body"
            className="text-sm leading-relaxed text-gray-700"
          >
            This tool provides general health information only and is{' '}
            <strong>not a substitute for professional medical advice</strong>, diagnosis, or
            treatment. Always seek the advice of your physician or other qualified health provider
            with any questions you may have regarding a medical condition.
          </p>

          <div className="mt-4 rounded-lg bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              <strong>In an emergency</strong>, call{' '}
              <a
                href="tel:911"
                className="font-semibold underline hover:no-underline"
              >
                911
              </a>{' '}
              immediately. For mental health crises, call or text{' '}
              <a
                href="tel:988"
                className="font-semibold underline hover:no-underline"
              >
                988
              </a>{' '}
              (Suicide &amp; Crisis Lifeline).
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAcknowledge}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            autoFocus
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
