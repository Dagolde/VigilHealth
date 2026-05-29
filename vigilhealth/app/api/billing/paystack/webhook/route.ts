/**
 * Paystack Webhook Handler
 *
 * POST /api/billing/paystack/webhook
 *
 * Handles Paystack subscription lifecycle events:
 * - charge.success
 * - subscription.create
 * - subscription.disable
 * - invoice.payment_failed
 *
 * Paystack sends webhooks with HMAC-SHA512 signature in x-paystack-signature header.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { verifyWebhookSignature } from '@/lib/billing/paystack-client';
import { enqueueEmail } from '@/lib/email/email-queue';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    customer?: {
      email: string;
      customer_code: string;
    };
    metadata?: Record<string, string>;
    subscription_code?: string;
    plan?: {
      plan_code: string;
      name: string;
      amount: number;
    };
    next_payment_date?: string;
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(body, signature);
  if (!isValid) {
    console.error('[Paystack Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(body) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.app';

  try {
    switch (event.event) {
      case 'charge.success': {
        const { metadata, customer } = event.data;
        const userId = metadata?.userId;
        const type = metadata?.type;
        const tier = metadata?.tier;

        if (userId && type && tier) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          if (type === 'business_listing' || type === 'b2b') {
            await supabase
              .from('business_organizations')
              .update({
                subscription_tier: tier === 'premium' || tier === 'enterprise' ? 'premium' : 'basic',
                subscription_expires_at: expiresAt.toISOString(),
              })
              .eq('id', userId);
          }

          if (type === 'safe_badge') {
            const badgeExpiry = new Date();
            badgeExpiry.setDate(badgeExpiry.getDate() + 30);
            await supabase
              .from('supply_locations')
              .update({
                has_safe_badge: true,
                safe_badge_expires_at: badgeExpiry.toISOString(),
              })
              .eq('id', userId);
          }
        }

        // Send confirmation email
        if (customer?.email) {
          enqueueEmail({
            to: customer.email,
            subject: 'VigilHealth payment successful',
            html: `<p>Your VigilHealth payment was successful. <a href="${appUrl}/business/subscription">Manage subscription</a>.</p>`,
            text: `Your VigilHealth payment was successful. Manage at ${appUrl}/business/subscription`,
          });
        }
        break;
      }

      case 'subscription.disable': {
        const { metadata, customer } = event.data;
        const userId = metadata?.userId;

        if (userId) {
          // Revert to free tier
          await supabase
            .from('business_organizations')
            .update({
              subscription_tier: 'free',
              subscription_expires_at: null,
            })
            .eq('id', userId);

          await supabase
            .from('supply_locations')
            .update({ is_premium: false })
            .eq('id', userId);
        }

        if (customer?.email) {
          enqueueEmail({
            to: customer.email,
            subject: 'VigilHealth subscription cancelled',
            html: `<p>Your VigilHealth subscription has been cancelled. <a href="${appUrl}/business/subscription">Resubscribe</a>.</p>`,
            text: `Your VigilHealth subscription has been cancelled. Resubscribe at ${appUrl}/business/subscription`,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const { customer } = event.data;
        if (customer?.email) {
          enqueueEmail({
            to: customer.email,
            subject: 'VigilHealth payment failed',
            html: `<p>Your VigilHealth payment failed. Please update your payment method at <a href="${appUrl}/business/subscription">${appUrl}/business/subscription</a>.</p>`,
            text: `Your VigilHealth payment failed. Update at ${appUrl}/business/subscription`,
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Paystack Webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
