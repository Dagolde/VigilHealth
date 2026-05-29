/**
 * Telehealth Provider API Client
 * 
 * Client for integrating with telehealth provider APIs
 * Currently implements a mock/demo integration for Teladoc and MDLive
 * 
 * In production, this would make actual API calls to partner systems
 */

import { getProviderById } from './providers';
import type { ProviderAvailability, BookingRequest, BookingResponse } from './types';

/**
 * Fetch availability for a specific provider
 * 
 * @param providerId - Provider identifier
 * @returns Provider availability information
 */
export async function fetchProviderAvailability(
  providerId: string
): Promise<ProviderAvailability | null> {
  const provider = getProviderById(providerId);

  if (!provider || !provider.isActive) {
    return null;
  }

  // In production, this would make an actual API call to the provider
  // For now, we return mock data based on provider ID
  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock availability data
    const mockAvailability: ProviderAvailability = {
      providerId: provider.id,
      providerName: provider.name,
      isAvailable: true,
      estimatedWaitTime: getMockWaitTime(provider.id),
      nextAvailableSlot: getNextAvailableSlot(),
    };

    return mockAvailability;
  } catch (error) {
    console.error(`Error fetching availability for ${providerId}:`, error);
    return null;
  }
}

/**
 * Fetch availability for all active providers
 * 
 * @returns Array of provider availability information
 */
export async function fetchAllProviderAvailability(): Promise<ProviderAvailability[]> {
  const { getActiveProviders } = await import('./providers');
  const activeProviders = getActiveProviders();

  const availabilityPromises = activeProviders.map((provider) =>
    fetchProviderAvailability(provider.id)
  );

  const results = await Promise.all(availabilityPromises);

  // Filter out null results (unavailable providers)
  return results.filter((result): result is ProviderAvailability => result !== null);
}

/**
 * Book a telehealth consultation
 * 
 * @param request - Booking request details
 * @returns Booking response with referral code
 */
export async function bookTelehealthConsultation(
  request: BookingRequest
): Promise<BookingResponse> {
  const provider = getProviderById(request.providerId);

  if (!provider || !provider.isActive) {
    return {
      success: false,
      error: 'Provider not available',
    };
  }

  // Validate user consent
  if (!request.userConsent) {
    return {
      success: false,
      error: 'User consent required to share symptom data',
    };
  }

  // Validate contact information
  if (!request.userContact.email) {
    return {
      success: false,
      error: 'Email address required',
    };
  }

  try {
    // In production, this would make an actual API call to the provider's booking endpoint
    // For now, we simulate a successful booking
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Generate a mock booking ID and referral code
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const referralCode = generateReferralCode(request.providerId, request.userId);

    const response: BookingResponse = {
      success: true,
      bookingId,
      referralCode,
      confirmationUrl: `${provider.apiEndpoint}/booking/${bookingId}`,
      estimatedWaitTime: getMockWaitTime(provider.id),
    };

    return response;
  } catch (error) {
    console.error(`Error booking consultation with ${request.providerId}:`, error);
    return {
      success: false,
      error: 'Failed to book consultation. Please try again.',
    };
  }
}

/**
 * Generate a unique referral tracking code
 * 
 * Format: PROVIDER-TIMESTAMP-USERID-RANDOM
 * Example: TELADOC-1704067200-abc123-x7k9
 * 
 * @param providerId - Provider identifier
 * @param userId - User identifier
 * @returns Unique referral code
 */
export function generateReferralCode(providerId: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  const userIdShort = userId.substring(0, 8);

  return `${providerId.toUpperCase()}-${timestamp}-${userIdShort}-${random}`;
}

/**
 * Mock function to get wait time based on provider
 * In production, this would come from the provider's API
 */
function getMockWaitTime(providerId: string): number {
  const waitTimes: Record<string, number> = {
    teladoc: 15, // 15 minutes
    mdlive: 20, // 20 minutes
    amwell: 10, // 10 minutes
  };

  return waitTimes[providerId] || 15;
}

/**
 * Mock function to get next available slot
 * In production, this would come from the provider's API
 */
function getNextAvailableSlot(): string {
  const now = new Date();
  // Next available slot is 30 minutes from now
  const nextSlot = new Date(now.getTime() + 30 * 60 * 1000);
  return nextSlot.toISOString();
}
