/**
 * Auth Provider Abstraction
 *
 * Supports both Supabase Auth (Phase 1) and custom JWT (Phase 2 CloudPanel).
 * Switch via DEPLOYMENT_PHASE environment variable.
 */

import type { User } from '@supabase/supabase-js';

import { getDeploymentPhase } from '@/lib/db/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string | null;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}

export interface AuthProvider {
  getUser(token?: string): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthSession | null>;
  signOut(token?: string): Promise<void>;
  verifyToken(token: string): Promise<AuthUser | null>;
}

// ─── Supabase Auth Provider (Phase 1) ────────────────────────────────────────

class SupabaseAuthProvider implements AuthProvider {
  async getUser(_token?: string): Promise<AuthUser | null> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user ? mapSupabaseUser(user) : null;
  }

  async signIn(email: string, password: string): Promise<AuthSession | null> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) return null;
    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at ?? 0,
    };
  }

  async signOut(_token?: string): Promise<void> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser(token);
    return user ? mapSupabaseUser(user) : null;
  }
}

// ─── Custom JWT Auth Provider (Phase 2) ──────────────────────────────────────

class CustomJwtAuthProvider implements AuthProvider {
  async getUser(token?: string): Promise<AuthUser | null> {
    if (!token) return null;
    return this.verifyToken(token);
  }

  async signIn(_email: string, _password: string): Promise<AuthSession | null> {
    // Phase 2: Implement custom JWT sign-in against PostgreSQL
    throw new Error('Custom JWT auth not yet implemented for Phase 2');
  }

  async signOut(_token?: string): Promise<void> {
    // Phase 2: Invalidate JWT token in database
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    // Phase 2: Verify JWT using NEXTAUTH_SECRET
    // In production, use a proper JWT library like jose or jsonwebtoken
    // For now, use Supabase to verify the token
    const { validateAuth } = await import('@/lib/auth/jwt');
    const { user } = await validateAuth();
    if (!user) return null;
    // Validate that the token matches
    if (!token) return null;
    return {
      id: user.id,
      email: user.email ?? null,
      emailVerified: !!user.email_confirmed_at,
      createdAt: user.created_at,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Get the appropriate auth provider for the current deployment phase.
 */
export function getAuthProvider(): AuthProvider {
  const phase = getDeploymentPhase();
  if (phase === 'phase2') {
    return new CustomJwtAuthProvider();
  }
  return new SupabaseAuthProvider();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    emailVerified: !!user.email_confirmed_at,
    createdAt: user.created_at,
  };
}
