/**
 * Telehealth Integration Module
 * 
 * Exports all telehealth-related functionality for easy importing
 */

// Types
export type {
  TelehealthProvider,
  ProviderAvailability,
  BookingRequest,
  BookingResponse,
  ReferralTrackingData,
} from './types';

// Provider configuration
export {
  TELEHEALTH_PROVIDERS,
  getActiveProviders,
  getProviderById,
  getProviderCommissionRate,
} from './providers';

// API client
export {
  fetchProviderAvailability,
  fetchAllProviderAvailability,
  bookTelehealthConsultation,
  generateReferralCode,
} from './api-client';

// Referral tracking
export {
  storeReferral,
  getReferralByCode,
  markReferralCompleted,
  getUserPendingReferrals,
  getCommissionSummary,
  createReferralFromBooking,
} from './referral-tracking';
