'use client';

/**
 * ReportCountBadge
 *
 * Displays the number of community reports for a geographic area.
 * Shows nothing when count is 0.
 */

import React from 'react';

export interface ReportCountBadgeProps {
  count: number;
  recentCount: number; // last 7 days
  className?: string;
}

export function ReportCountBadge({ count, recentCount, className = '' }: ReportCountBadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ${className}`}
      aria-label={`${count} community reports, ${recentCount} in the last 7 days`}
    >
      <svg
        className="h-3 w-3 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      {count} {count === 1 ? 'report' : 'reports'}
      {recentCount > 0 && (
        <span className="text-gray-400">({recentCount} recent)</span>
      )}
    </span>
  );
}
