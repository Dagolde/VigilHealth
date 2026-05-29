/**
 * Telehealth Provider Types
 * 
 * Type definitions for telehealth provider integration
 */

export interface TelehealthProvider {
  id: string;
  name: string;
  apiEndpoint: string;
  commissionRate: number; // dollars per referral
  isActive: boolean;
}

export interface ProviderAvailability {
  providerId: string;
  providerName: string;
  isAvailable: boolean;
  estimatedWaitTime: number; // minutes
  nextAvailableSlot?: string; // ISO timestamp
}

export interface BookingRequest {
  providerId: string;
  userId: string;
  symptomSummary: string;
  userConsent: boolean;
  userContact: {
    email: string;
    phone?: string;
  };
  preferredTime?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingId?: string;
  referralCode?: string;
  confirmationUrl?: string;
  estimatedWaitTime?: number;
  error?: string;
}

export interface ReferralTrackingData {
  userId: string;
  providerId: string;
  providerName: string;
  referralCode: string;
  symptomSummary: string;
  commissionAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
}
