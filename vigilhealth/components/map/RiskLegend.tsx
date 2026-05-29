/**
 * RiskLegend component
 *
 * Displays a color-coded legend for the four risk levels used in the Risk Radar map.
 */

import React from 'react';

export interface RiskLevelConfig {
  level: 'low' | 'moderate' | 'high' | 'critical';
  label: string;
  color: string;
  description: string;
}

export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#ef4444',
  critical: '#7f1d1d',
};

export const RISK_LEVELS: RiskLevelConfig[] = [
  {
    level: 'low',
    label: 'Low',
    color: RISK_LEVEL_COLORS.low,
    description: 'Minimal community risk',
  },
  {
    level: 'moderate',
    label: 'Moderate',
    color: RISK_LEVEL_COLORS.moderate,
    description: 'Elevated community risk',
  },
  {
    level: 'high',
    label: 'High',
    color: RISK_LEVEL_COLORS.high,
    description: 'High community risk — take precautions',
  },
  {
    level: 'critical',
    label: 'Critical',
    color: RISK_LEVEL_COLORS.critical,
    description: 'Critical risk — follow official guidance',
  },
];

interface RiskLegendProps {
  className?: string;
}

export function RiskLegend({ className = '' }: RiskLegendProps) {
  return (
    <div
      role="complementary"
      aria-label="Risk level legend"
      className={`bg-white rounded-lg shadow-md p-3 ${className}`}
    >
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
        Risk Levels
      </h3>
      <ul className="space-y-1.5" role="list">
        {RISK_LEVELS.map(({ level, label, color, description }) => (
          <li key={level} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex-shrink-0 w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
              data-risk-level={level}
              data-risk-color={color}
            />
            <span className="text-xs text-gray-700">
              <span className="font-medium">{label}</span>
              <span className="sr-only"> — {description}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
