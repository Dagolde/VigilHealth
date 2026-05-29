/**
 * Realtime Client Abstraction
 *
 * Supports both Supabase Realtime (Phase 1) and Socket.io (Phase 2 CloudPanel).
 * Switch via DEPLOYMENT_PHASE environment variable.
 */

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import { getDeploymentPhase } from '@/lib/db/client';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventHandler = (data: unknown) => void;

export interface RealtimeClient {
  subscribe(channel: string, event: string, handler: EventHandler): () => void;
  unsubscribe(channel: string): void;
  publish(channel: string, event: string, data: unknown): Promise<void>;
  disconnect(): void;
}

// ─── Supabase Realtime Client (Phase 1) ──────────────────────────────────────

class SupabaseRealtimeClient implements RealtimeClient {
  private readonly channels: Map<string, RealtimeChannel> = new Map();
  private readonly supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient();
  }

  subscribe(channel: string, _event: string, handler: EventHandler): () => void {
    const ch = this.supabase
      .channel(channel)
      .on('broadcast', { event: '*' }, ({ payload }) => handler(payload))
      .subscribe();

    this.channels.set(channel, ch);

    return () => this.unsubscribe(channel);
  }

  unsubscribe(channel: string): void {
    const ch = this.channels.get(channel);
    if (ch) {
      void this.supabase.removeChannel(ch);
      this.channels.delete(channel);
    }
  }

  async publish(channel: string, event: string, data: unknown): Promise<void> {
    const ch = this.channels.get(channel);
    if (ch) {
      await ch.send({ type: 'broadcast', event, payload: data });
    }
  }

  disconnect(): void {
    for (const channel of this.channels.keys()) {
      this.unsubscribe(channel);
    }
  }
}

// ─── Socket.io Client (Phase 2) ───────────────────────────────────────────────

class SocketIoRealtimeClient implements RealtimeClient {
  private readonly handlers: Map<string, EventHandler> = new Map();

  subscribe(channel: string, event: string, handler: EventHandler): () => void {
    // Phase 2: Connect to Socket.io server
    // const { io } = await import('socket.io-client');
    // this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    // socket.on(`${channel}:${event}`, handler);

    this.handlers.set(`${channel}:${event}`, handler);

    return () => this.unsubscribe(channel);
  }

  unsubscribe(channel: string): void {
    for (const key of this.handlers.keys()) {
      if (key.startsWith(`${channel}:`)) {
        this.handlers.delete(key);
      }
    }
  }

  async publish(_channel: string, _event: string, _data: unknown): Promise<void> {
    // Phase 2: Emit via Socket.io
    throw new Error('Socket.io publish not yet implemented for Phase 2');
  }

  disconnect(): void {
    this.handlers.clear();
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _realtimeClient: RealtimeClient | null = null;

/**
 * Get the appropriate realtime client for the current deployment phase.
 */
export function getRealtimeClient(): RealtimeClient {
  if (_realtimeClient) return _realtimeClient;

  const phase = getDeploymentPhase();
  _realtimeClient = phase === 'phase2'
    ? new SocketIoRealtimeClient()
    : new SupabaseRealtimeClient();

  return _realtimeClient;
}

/**
 * Reset the realtime client singleton (for testing).
 */
export function resetRealtimeClient(): void {
  _realtimeClient?.disconnect();
  _realtimeClient = null;
}
