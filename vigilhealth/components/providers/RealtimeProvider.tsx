'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { RiskLevelChange } from '@/lib/realtime/risk-channel';
import { subscribeToRiskChannel, unsubscribeFromRiskChannel } from '@/lib/realtime/risk-channel';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealtimeContextType {
  isConnected: boolean;
  lastRiskChange: RiskLevelChange | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 10;

// ─── Context ──────────────────────────────────────────────────────────────────

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastRiskChange: null,
});

export function useRealtime(): RealtimeContextType {
  return useContext(RealtimeContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastRiskChange, setLastRiskChange] = useState<RiskLevelChange | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  const supabase = createClient();

  const clearHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(async () => {
    clearHeartbeat();
    clearReconnectTimeout();
    if (channelRef.current) {
      await unsubscribeFromRiskChannel(supabase, channelRef.current);
      channelRef.current = null;
    }
    if (isMountedRef.current) {
      setIsConnected(false);
    }
  }, [supabase, clearHeartbeat, clearReconnectTimeout]);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    const channel = subscribeToRiskChannel(
      supabase,
      (change) => {
        if (isMountedRef.current) {
          setLastRiskChange(change);
          reconnectAttemptsRef.current = 0;
        }
      },
      (_error) => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        clearHeartbeat();

        // Exponential backoff reconnect
        const attempts = reconnectAttemptsRef.current;
        if (attempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            BASE_RECONNECT_DELAY_MS * Math.pow(2, attempts),
            MAX_RECONNECT_DELAY_MS
          );
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) connect();
          }, delay);
        }
      }
    );

    channelRef.current = channel;

    // Start heartbeat ping
    clearHeartbeat();
    heartbeatRef.current = setInterval(() => {
      if (channelRef.current) {
        // Send a heartbeat to keep the connection alive
        void channelRef.current.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { ts: Date.now() },
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    if (isMountedRef.current) {
      setIsConnected(true);
    }
  }, [supabase, clearHeartbeat]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      void disconnect();
    };
  }, [connect, disconnect]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastRiskChange }}>
      {children}
    </RealtimeContext.Provider>
  );
}
