/**
 * Supabase Service Role Client
 *
 * Uses the service role key which bypasses RLS.
 * ONLY use this in server-side cron jobs and admin operations.
 * NEVER expose this client to the browser.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { type Database } from './types';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
