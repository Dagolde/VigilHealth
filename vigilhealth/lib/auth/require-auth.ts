import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

/**
 * Server-side auth guard for Server Components and Server Actions.
 * Redirects to /login if the user is not authenticated.
 * Returns the authenticated user if valid.
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return user;
}
