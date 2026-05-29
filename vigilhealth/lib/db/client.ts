/**
 * Database Connection Abstraction
 *
 * Supports both Supabase (Phase 1) and direct PostgreSQL (Phase 2 CloudPanel).
 * Switch via DEPLOYMENT_PHASE environment variable.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeploymentPhase = 'phase1' | 'phase2';

export interface DbClient {
  /** Execute a raw query (Phase 2 only) */
  query?: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  /** Supabase client (Phase 1 only) */
  supabase?: SupabaseClient<Database>;
  /** Current deployment phase */
  phase: DeploymentPhase;
}

// ─── Phase Detection ──────────────────────────────────────────────────────────

export function getDeploymentPhase(): DeploymentPhase {
  const phase = process.env.DEPLOYMENT_PHASE;
  if (phase === 'phase2') return 'phase2';
  return 'phase1';
}

// ─── Client Factory ───────────────────────────────────────────────────────────

/**
 * Get the appropriate database client for the current deployment phase.
 *
 * Phase 1: Returns a Supabase client
 * Phase 2: Returns a direct PostgreSQL client (pg)
 */
export async function getDbClient(): Promise<DbClient> {
  const phase = getDeploymentPhase();

  if (phase === 'phase2') {
    // Phase 2: Direct PostgreSQL connection
    // In production, import 'pg' and create a Pool
    // const { Pool } = await import('pg');
    // const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // return { phase: 'phase2', query: (sql, params) => pool.query(sql, params) };

    // Placeholder for Phase 2 implementation
    throw new Error(
      'Phase 2 PostgreSQL client not yet configured. Set DEPLOYMENT_PHASE=phase1 or implement the pg client.'
    );
  }

  // Phase 1: Supabase client
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  return {
    phase: 'phase1',
    supabase,
  };
}

/**
 * Get a browser-side database client (always Supabase in Phase 1).
 */
export function getBrowserDbClient(): DbClient {
  // Dynamic import is handled at call site for browser environments
  // This function is only called client-side where createClient is available
  const phase = getDeploymentPhase();
  return {
    phase,
    supabase: undefined, // Caller must import createClient from @/lib/supabase/client
  };
}
