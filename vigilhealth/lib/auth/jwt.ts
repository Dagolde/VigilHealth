import type { User } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';

/**
 * Validates the current session and returns the authenticated user.
 * Returns { user: null, error: 'Unauthorized' } if not authenticated.
 */
export async function validateAuth(): Promise<{
  user: User | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  return { user, error: null };
}

/**
 * Returns the authenticated user or null (no redirect).
 * Useful for optional auth checks.
 */
export async function requireAuthOrNull(): Promise<User | null> {
  const { user } = await validateAuth();
  return user;
}
