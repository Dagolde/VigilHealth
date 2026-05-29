/**
 * Telehealth Booking API
 * 
 * POST /api/telehealth/book
 * Books a telehealth consultation and creates a referral tracking record
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { bookTelehealthConsultation } from '@/lib/telehealth/api-client';
import { getProviderById } from '@/lib/telehealth/providers';
import { createReferralFromBooking } from '@/lib/telehealth/referral-tracking';

export const runtime = 'edge';

interface BookingRequestBody {
  providerId: string;
  symptomSummary: string;
  userConsent: boolean;
  userContact: {
    email: string;
    phone?: string;
  };
  preferredTime?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: BookingRequestBody = await request.json();

    // Validate required fields
    if (!body.providerId || !body.symptomSummary || !body.userContact?.email) {
      return NextResponse.json(
        { error: 'Missing required fields: providerId, symptomSummary, userContact.email' },
        { status: 400 }
      );
    }

    // Validate user consent
    if (!body.userConsent) {
      return NextResponse.json(
        { error: 'User consent required to share symptom data with telehealth provider' },
        { status: 400 }
      );
    }

    // Validate provider exists
    const provider = getProviderById(body.providerId);
    if (!provider || !provider.isActive) {
      return NextResponse.json(
        { error: 'Invalid or inactive provider' },
        { status: 400 }
      );
    }

    // Book consultation with provider
    const bookingResponse = await bookTelehealthConsultation({
      providerId: body.providerId,
      userId: user.id,
      symptomSummary: body.symptomSummary,
      userConsent: body.userConsent,
      userContact: body.userContact,
      preferredTime: body.preferredTime,
    });

    if (!bookingResponse.success || !bookingResponse.referralCode) {
      return NextResponse.json(
        {
          error: bookingResponse.error || 'Failed to book consultation',
        },
        { status: 500 }
      );
    }

    // Store referral in database for commission tracking
    const referralId = await createReferralFromBooking(
      user.id,
      body.providerId,
      provider.name,
      bookingResponse.referralCode,
      body.symptomSummary
    );

    if (!referralId) {
      console.error('Failed to store referral tracking data');
      // Don't fail the booking, but log the error
    }

    // Return booking confirmation
    return NextResponse.json(
      {
        success: true,
        bookingId: bookingResponse.bookingId,
        referralCode: bookingResponse.referralCode,
        referralId,
        confirmationUrl: bookingResponse.confirmationUrl,
        estimatedWaitTime: bookingResponse.estimatedWaitTime,
        provider: {
          id: provider.id,
          name: provider.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing booking request:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
