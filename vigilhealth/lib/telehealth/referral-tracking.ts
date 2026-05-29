/**
 * Telehealth Referral Tracking Service
 * 
 * Handles storing and tracking telehealth referrals for commission calculation
 */

import { createClient } from '@/lib/supabase/server';

import { getProviderCommissionRate } from './providers';
import type { ReferralTrackingData } from './types';

/**
 * Store a new telehealth referral in the database
 * 
 * @param data - Referral tracking data
 * @returns Referral ID if successful, null otherwise
 */
export async function storeReferral(data: ReferralTrackingData): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data: referral, error } = await supabase
      .from('telehealth_referrals')
      .insert({
        user_id: data.userId,
        provider_id: data.providerId,
        provider_name: data.providerName,
        referral_code: data.referralCode,
        symptom_summary: data.symptomSummary,
        status: data.status,
        commission_amount: data.commissionAmount,
        commission_paid: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing referral:', error);
      return null;
    }

    return referral.id;
  } catch (error) {
    console.error('Error storing referral:', error);
    return null;
  }
}

/**
 * Get referral by referral code
 * 
 * @param referralCode - Unique referral code
 * @returns Referral data if found, null otherwise
 */
export async function getReferralByCode(referralCode: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('telehealth_referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    if (error) {
      console.error('Error fetching referral:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching referral:', error);
    return null;
  }
}

/**
 * Update referral status to completed
 * 
 * @param referralCode - Unique referral code
 * @returns True if successful, false otherwise
 */
export async function markReferralCompleted(referralCode: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('telehealth_referrals')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('referral_code', referralCode);

    if (error) {
      console.error('Error updating referral:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating referral:', error);
    return false;
  }
}

/**
 * Get all pending referrals for a user
 * 
 * @param userId - User identifier
 * @returns Array of pending referrals
 */
export async function getUserPendingReferrals(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('telehealth_referrals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user referrals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user referrals:', error);
    return [];
  }
}

/**
 * Get commission summary for a date range
 * 
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Commission summary data
 */
export async function getCommissionSummary(startDate: string, endDate: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('telehealth_referrals')
      .select('provider_id, provider_name, commission_amount, status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.error('Error fetching commission summary:', error);
      return null;
    }

    // Aggregate by provider
    const summary = data.reduce(
      (acc: Record<string, {
        providerName: string;
        totalReferrals: number;
        completedReferrals: number;
        pendingReferrals: number;
        totalCommission: number;
        earnedCommission: number;
      }>, referral) => {
        const providerId = referral.provider_id;

        if (!acc[providerId]) {
          acc[providerId] = {
            providerName: referral.provider_name,
            totalReferrals: 0,
            completedReferrals: 0,
            pendingReferrals: 0,
            totalCommission: 0,
            earnedCommission: 0,
          };
        }

        acc[providerId].totalReferrals += 1;

        if (referral.status === 'completed') {
          acc[providerId].completedReferrals += 1;
          acc[providerId].earnedCommission += Number(referral.commission_amount) || 0;
        } else if (referral.status === 'pending') {
          acc[providerId].pendingReferrals += 1;
        }

        acc[providerId].totalCommission += Number(referral.commission_amount) || 0;

        return acc;
      },
      {} as Record<string, {
        providerName: string;
        totalReferrals: number;
        completedReferrals: number;
        pendingReferrals: number;
        totalCommission: number;
        earnedCommission: number;
      }>
    );

    return summary;
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    return null;
  }
}

/**
 * Create a referral tracking record from booking data
 * 
 * @param userId - User identifier
 * @param providerId - Provider identifier
 * @param providerName - Provider name
 * @param referralCode - Unique referral code
 * @param symptomSummary - User's symptom summary
 * @returns Referral ID if successful, null otherwise
 */
export async function createReferralFromBooking(
  userId: string,
  providerId: string,
  providerName: string,
  referralCode: string,
  symptomSummary: string
): Promise<string | null> {
  const commissionAmount = getProviderCommissionRate(providerId);

  const referralData: ReferralTrackingData = {
    userId,
    providerId,
    providerName,
    referralCode,
    symptomSummary,
    commissionAmount,
    status: 'pending',
  };

  return storeReferral(referralData);
}
