/**
 * Risk Channel — Supabase Realtime WebSocket
 *
 * Subscribes to risk_levels table changes and broadcasts updates
 * to connected clients via a Supabase Realtime channel.
 */

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RiskLevelChange {
  id: string;
  disease: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical' | null;
  locationName: string;
  city: string | null;
  state: string | null;
  updatedAt: string;
}

export type RiskChangeHandler = (change: RiskLevelChange) => void;

// ─── Channel Factory ──────────────────────────────────────────────────────────

/**
 * Subscribe to risk level changes for a specific location.
 * Returns the channel so the caller can unsubscribe later.
 */
export function subscribeToRiskChannel(
  supabase: SupabaseClient<Database>,
  onRiskChange: RiskChangeHandler,
  onError?: (error: Error) => void
): RealtimeChannel {
  const channel = supabase
    .channel('risk-level-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'risk_levels',
      },
      (payload) => {
        try {
          const record = (payload.new ?? payload.old) as {
            id: string;
            disease: string;
            risk_level: 'low' | 'moderate' | 'high' | 'critical' | null;
            location_name: string;
            city: string | null;
            state: string | null;
            updated_at: string;
          };

          if (!record?.id) return;

          onRiskChange({
            id: record.id,
            disease: record.disease,
            riskLevel: record.risk_level,
            locationName: record.location_name,
            city: record.city,
            state: record.state,
            updatedAt: record.updated_at,
          });
        } catch (err) {
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Realtime channel error'));
      }
    });

  return channel;
}

/**
 * Unsubscribe from a risk channel.
 */
export async function unsubscribeFromRiskChannel(
  supabase: SupabaseClient<Database>,
  channel: RealtimeChannel
): Promise<void> {
  await supabase.removeChannel(channel);
}
