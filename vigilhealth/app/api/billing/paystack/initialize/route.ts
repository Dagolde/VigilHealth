/**
 * Paystack Payment Initialization API
 *
 * POST /api/billing/paystack/initialize
 *
 * Creates a Paystack transaction for African users (NGN, GHS, KES, ZAR).
 * Returns an authorization_url to redirect the user to Paystack's hosted page.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  generateReference,
  getPaystackAmount,
  initializeTransaction,
} from '@/lib/billing/paystack-client';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack not configured' }, { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      type?: string;
      tier?: string;
      currency?: 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'USD';
      businessName?: string;
    };

    const {
      type = 'business_listing',
      tier = 'basic',
      currency = 'NGN',
      businessName,
    } = body;

    // Get the amount for this type/tier/currency
    const amount = getPaystackAmount(type, tier, currency === 'USD' ? 'USD' : 'NGN');
    if (!amount) {
      return NextResponse.json({ error: 'Invalid subscription type or tier' }, { status: 400 });
    }

    // Get user email from Supabase auth
    const email = user.email;
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const reference = generateReference();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const response = await initializeTransaction({
      email,
      amount,
      currency,
      reference,
      callbackUrl: `${appUrl}/api/billing/paystack/callback?reference=${reference}`,
      metadata: {
        userId: user.id,
        type,
        tier,
        businessName: businessName ?? '',
        currency,
      },
      channels: ['card', 'bank', 'ussd', 'mobile_money', 'bank_transfer'],
    });

    if (!response.status) {
      return NextResponse.json(
        { error: response.message ?? 'Failed to initialize payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: response.data.authorization_url,
      reference: response.data.reference,
      accessCode: response.data.access_code,
    });
  } catch (error) {
    console.error('[Paystack Initialize] Error:', error);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
