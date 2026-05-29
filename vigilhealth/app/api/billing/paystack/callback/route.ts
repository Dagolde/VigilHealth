/**
 * Paystack Payment Callback
 *
 * GET /api/billing/paystack/callback?reference=VH-XXXXX
 *
 * Paystack redirects here after payment. We verify the transaction
 * and update the subscription in the database.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { verifyTransaction } from '@/lib/billing/paystack-client';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.vercel.app';

  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(`${appUrl}/business/register?error=missing_reference`);
    }

    // Verify the transaction with Paystack
    const verification = await verifyTransaction(reference);

    if (!verification.status || verification.data.status !== 'success') {
      return NextResponse.redirect(
        `${appUrl}/business/register?error=payment_failed&reference=${reference}`
      );
    }

    const { metadata } = verification.data;
    const userId = metadata?.userId;
    const type = metadata?.type;
    const tier = metadata?.tier;

    if (!userId || !type || !tier) {
      return NextResponse.redirect(`${appUrl}/business/register?error=invalid_metadata`);
    }

    // Update subscription in database
    const supabase = await createClient();

    if (type === 'business_listing' || type === 'b2b') {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await supabase
        .from('business_organizations')
        .update({
          subscription_tier: tier === 'premium' || tier === 'enterprise' ? 'premium' : 'basic',
          subscription_expires_at: expiresAt.toISOString(),
          paystack_reference: reference,
        })
        .eq('id', userId);
    }

    if (type === 'safe_badge') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from('supply_locations')
        .update({
          has_safe_badge: true,
          safe_badge_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId);
    }

    return NextResponse.redirect(
      `${appUrl}/business/register?success=true&provider=paystack&reference=${reference}`
    );
  } catch (error) {
    console.error('[Paystack Callback] Error:', error);
    return NextResponse.redirect(`${appUrl}/business/register?error=server_error`);
  }
}
