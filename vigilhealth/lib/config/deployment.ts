/**
 * Deployment Configuration
 *
 * Environment-based config switching for Phase 1 (Vercel + Supabase)
 * and Phase 2 (CloudPanel + self-hosted PostgreSQL).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeploymentPhase = 'phase1' | 'phase2';

export interface DeploymentConfig {
  phase: DeploymentPhase;
  database: {
    provider: 'supabase' | 'postgresql';
    url: string;
    poolSize: number;
  };
  auth: {
    provider: 'supabase' | 'custom-jwt';
    jwtSecret: string;
  };
  realtime: {
    provider: 'supabase' | 'socketio';
    url?: string;
  };
  storage: {
    provider: 'supabase' | 'local';
    bucket?: string;
  };
  email: {
    provider: 'resend' | 'smtp';
    apiKey?: string;
    smtpHost?: string;
    smtpPort?: number;
  };
}

// ─── Config Factory ───────────────────────────────────────────────────────────

/**
 * Get the deployment configuration for the current environment.
 */
export function getDeploymentConfig(): DeploymentConfig {
  const phase = (process.env.DEPLOYMENT_PHASE ?? 'phase1') as DeploymentPhase;

  if (phase === 'phase2') {
    return {
      phase: 'phase2',
      database: {
        provider: 'postgresql',
        url: process.env.DATABASE_URL ?? '',
        poolSize: parseInt(process.env.DB_POOL_SIZE ?? '20', 10),
      },
      auth: {
        provider: 'custom-jwt',
        jwtSecret: process.env.NEXTAUTH_SECRET ?? '',
      },
      realtime: {
        provider: 'socketio',
        url: process.env.SOCKET_IO_URL,
      },
      storage: {
        provider: 'local',
      },
      email: {
        provider: 'smtp',
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
      },
    };
  }

  // Phase 1: Vercel + Supabase
  return {
    phase: 'phase1',
    database: {
      provider: 'supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      poolSize: 10,
    },
    auth: {
      provider: 'supabase',
      jwtSecret: process.env.NEXTAUTH_SECRET ?? '',
    },
    realtime: {
      provider: 'supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    storage: {
      provider: 'supabase',
      bucket: 'public',
    },
    email: {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY,
    },
  };
}

/**
 * Check if running in Phase 2 (CloudPanel).
 */
export function isPhase2(): boolean {
  return process.env.DEPLOYMENT_PHASE === 'phase2';
}

/**
 * Check if running in Phase 1 (Vercel + Supabase).
 */
export function isPhase1(): boolean {
  return !isPhase2();
}
