import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profile';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // Redirect to login with error message if code exchange fails
      return NextResponse.redirect(`${origin}/login?error=verification_failed`);
    }
  }

  // Use NEXT_PUBLIC_APP_URL if set (handles localhost vs production correctly)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  return NextResponse.redirect(`${appUrl}${next}`);
}
