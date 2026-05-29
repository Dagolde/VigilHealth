/**
 * Resend Email Webhook
 *
 * POST /api/email/webhook
 * Receives delivery status events from Resend.
 * https://resend.com/docs/dashboard/webhooks/introduction
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

type ResendWebhookEvent =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.complained'
  | 'email.bounced'
  | 'email.opened'
  | 'email.clicked';

interface ResendWebhookPayload {
  type: ResendWebhookEvent;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
    [key: string]: unknown;
  };
}

export async function POST(request: NextRequest) {
  try {
    // In production, verify the Resend webhook signature
    // const svixId = request.headers.get('svix-id');
    // const svixTimestamp = request.headers.get('svix-timestamp');
    // const svixSignature = request.headers.get('svix-signature');

    const payload: ResendWebhookPayload = await request.json();

    const { type, data } = payload;

    switch (type) {
      case 'email.delivered':
        // Delivery confirmed — could update status in DB
        break;
      case 'email.bounced':
        // Could mark email as invalid / suppress future sends
        // Return bounce info in response for monitoring
        return NextResponse.json({ received: true, event: type, to: data.to }, { status: 200 });
      case 'email.complained':
        // Could auto-unsubscribe user
        return NextResponse.json({ received: true, event: type, to: data.to }, { status: 200 });
      default:
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Email Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
