'use server';

import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function forgotPassword(formData: FormData): Promise<{
  success?: boolean;
  error?: string;
}> {
  const raw = {
    email: formData.get('email') as string,
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      (process.env.NEXT_PUBLIC_APP_URL ?? '') + '/reset-password',
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
