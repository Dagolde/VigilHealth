/**
 * Telehealth Provider Webhook
 * 
 * POST /api/telehealth/webhook
 * Receives completion notifications from telehealth providers
 * 
 * This endpoint allows providers to notify us when a consultation is completed
 * so we can update the referral status and calculate commissions
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getReferralByCode, markReferralCompleted } from '@/lib/telehealth/referral-tracking';

export const runtime = 'edge';

interface WebhookPayload {
  referralCode: string;
  providerId: string;
  status: 'completed' | 'cancelled';
  completedAt?: string;
  // Additional fields that providers might send
  consultationId?: string;
  duration?: number;
}

export async function POST(request: NextRequest) {
  try {
    // In production, verify webhook signature here
    // const signature = request.headers.get('x-webhook-signature');
    // if (!verifyWebhookSignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const body: WebhookPayload = await request.json();

    // Validate required fields
    if (!body.referralCode || !body.providerId || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: referralCode, providerId, status' },
        { status: 400 }
      );
    }

    // Verify referral exists
    const referral = await getReferralByCode(body.referralCode);

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    // Verify provider matches
    if (referral.provider_id !== body.providerId) {
      return NextResponse.json(
        { error: 'Provider ID mismatch' },
        { status: 400 }
      );
    }

    // Update referral status
    if (body.status === 'completed') {
      const success = await markReferralCompleted(body.referralCode);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update referral status' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Referral marked as completed',
          referralId: referral.id,
          commissionAmount: referral.commission_amount,
        },
        { status: 200 }
      );
    } else if (body.status === 'cancelled') {
      // Handle cancellation
      // In production, you might want to update status to 'cancelled'
      return NextResponse.json(
        {
          success: true,
          message: 'Referral cancellation noted',
          referralId: referral.id,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid status value' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
