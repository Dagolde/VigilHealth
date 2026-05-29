'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// In-memory rate limiter — keyed by email
// NOTE: This resets on server restart / cold start. For production, use Redis.
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email: string): {
  allowed: boolean;
  remainingMs?: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now > entry.resetAt) {
    // First attempt or window expired — reset
    rateLimitMap.set(email, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remainingMs: entry.resetAt - now };
  }

  // Increment count
  rateLimitMap.set(email, { count: entry.count + 1, resetAt: entry.resetAt });
  return { allowed: true };
}

export async function loginUser(formData: FormData): Promise<{
  error?: string;
}> {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  // Rate limit check
  const rateCheck = checkRateLimit(email);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.remainingMs ?? WINDOW_MS) / 60000);
    return {
      error: `Too many failed attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Invalid email or password. Please try again.' };
  }

  // Success — redirect to home
  redirect('/');
}
