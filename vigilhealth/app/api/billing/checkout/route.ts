/**
 * Stripe Checkout Session API
 *
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for business listings, safe badges, or B2B subscriptions.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { createClient } from '@/lib/supabase/server';

// ─── Pricing ──────────────────────────────────────────────────────────────────

const PRICE_MAP: Record<string, Record<string, number>> = {
  business_listing: {
    basic: 2900,   // $29/month
    premium: 7900, // $79/month
  },
  safe_badge: {
    standard: 4900, // $49/month
  },
  b2b: {
    basic: 9900,    // $99/month
    professional: 19900, // $199/month
    enterprise: 29900,   // $299/month
  },
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-10-28.acacia' });
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      tier?: string;
      type?: string;
      businessName?: string;
    };

    const { tier = 'basic', type = 'business_listing', businessName } = body;

    const priceGroup = PRICE_MAP[type];
    if (!priceGroup) {
      return NextResponse.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    const unitAmount = priceGroup[tier];
    if (!unitAmount) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: businessName ?? `VigilHealth ${type} — ${tier}`,
            },
            unit_amount: unitAmount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        type,
        tier,
        businessName: businessName ?? '',
      },
      success_url: `${appUrl}/business/register?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/business/register?cancelled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Billing Checkout] Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
