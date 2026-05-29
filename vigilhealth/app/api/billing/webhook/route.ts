/**
 * Stripe Webhook Handler
 *
 * POST /api/billing/webhook
 * Handles Stripe subscription lifecycle events.
 * Reverts listings to standard on subscription expiry.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { enqueueEmail } from '@/lib/email/email-queue';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-10-28.acacia' });

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[BillingWebhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const type = subscription.metadata?.type;
        const tier = subscription.metadata?.tier;

        if (userId && type === 'business_listing') {
          await supabase
            .from('business_organizations')
            .update({
              subscription_tier: tier === 'premium' ? 'premium' : 'basic',
              stripe_subscription_id: subscription.id,
              subscription_expires_at: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          // Revert to standard (free) on subscription expiry
          await supabase
            .from('business_organizations')
            .update({
              subscription_tier: 'free',
              subscription_expires_at: null,
              stripe_subscription_id: null,
            })
            .eq('id', userId);

          // Also remove premium flag from supply locations
          await supabase
            .from('supply_locations')
            .update({ is_premium: false })
            .eq('id', userId);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Send renewal confirmation email
        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId);

        if (customer && !customer.deleted && customer.email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.app';
          enqueueEmail({
            to: customer.email,
            subject: 'VigilHealth subscription renewed',
            html: `<p>Your VigilHealth subscription has been renewed. <a href="${appUrl}/business/subscription">Manage subscription</a>.</p>`,
            text: `Your VigilHealth subscription has been renewed. Manage at ${appUrl}/business/subscription`,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId);

        if (customer && !customer.deleted && customer.email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.app';
          enqueueEmail({
            to: customer.email,
            subject: 'VigilHealth payment failed',
            html: `<p>Your VigilHealth subscription payment failed. Please update your payment method at <a href="${appUrl}/business/subscription">${appUrl}/business/subscription</a>.</p>`,
            text: `Your VigilHealth subscription payment failed. Update at ${appUrl}/business/subscription`,
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[BillingWebhook] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
