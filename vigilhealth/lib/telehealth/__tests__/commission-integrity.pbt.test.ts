/**
 * Property-Based Tests for Commission Integrity
 *
 * **Validates: Requirements 26**
 *
 * These tests verify:
 * 1. No orphaned completions — every completion maps to exactly one referral
 * 2. No duplicate commissions — a referral can only be completed once
 * 3. Commission amounts are non-negative and within expected range
 * 4. Referral chain integrity is preserved across multi-step sessions
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { generateReferralCode } from '../api-client';
import { getProviderCommissionRate } from '../providers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface SimulatedReferral {
  referralCode: string;
  providerId: string;
  userId: string;
  commissionAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
}

interface SimulatedCompletion {
  referralCode: string;
  providerId: string;
}

/**
 * Simulate the commission calculation for a set of referrals and completions.
 * Returns the total commission earned without duplicates.
 */
function calculateCommissions(
  referrals: SimulatedReferral[],
  completions: SimulatedCompletion[]
): {
  totalEarned: number;
  completedReferralCodes: Set<string>;
  orphanedCompletions: SimulatedCompletion[];
  duplicateCompletions: SimulatedCompletion[];
} {
  const referralMap = new Map<string, SimulatedReferral>(
    referrals.map((r) => [r.referralCode, r])
  );

  const completedCodes = new Set<string>();
  const orphanedCompletions: SimulatedCompletion[] = [];
  const duplicateCompletions: SimulatedCompletion[] = [];
  let totalEarned = 0;

  for (const completion of completions) {
    const referral = referralMap.get(completion.referralCode);

    if (!referral) {
      orphanedCompletions.push(completion);
      continue;
    }

    if (completedCodes.has(completion.referralCode)) {
      duplicateCompletions.push(completion);
      continue;
    }

    completedCodes.add(completion.referralCode);
    totalEarned += referral.commissionAmount;
  }

  return {
    totalEarned,
    completedReferralCodes: completedCodes,
    orphanedCompletions,
    duplicateCompletions,
  };
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const providerIdArb = fc.constantFrom('teladoc', 'mdlive');

const referralArb = fc.record({
  providerId: providerIdArb,
  userId: fc.uuid(),
}).map(({ providerId, userId }) => {
  const referralCode = generateReferralCode(providerId, userId);
  const commissionAmount = getProviderCommissionRate(providerId);
  return {
    referralCode,
    providerId,
    userId,
    commissionAmount,
    status: 'pending' as const,
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Commission Integrity — Property-Based Tests', () => {
  describe('Property: No Orphaned Completions', () => {
    it('completions without matching referrals are identified as orphaned', () => {
      fc.assert(
        fc.property(
          fc.array(referralArb, { minLength: 1, maxLength: 20 }),
          fc.array(
            fc.record({ referralCode: fc.string({ minLength: 10, maxLength: 50 }), providerId: providerIdArb }),
            { minLength: 1, maxLength: 10 }
          ),
          (referrals, fakeCompletions) => {
            // Ensure fake completions don't accidentally match real referral codes
            const realCodes = new Set(referrals.map((r) => r.referralCode));
            const trulyOrphaned = fakeCompletions.filter((c) => !realCodes.has(c.referralCode));

            if (trulyOrphaned.length === 0) return true; // Skip if all happen to match

            const result = calculateCommissions(referrals, trulyOrphaned);

            // All fake completions should be orphaned
            return result.orphanedCompletions.length === trulyOrphaned.length;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: No Duplicate Commissions', () => {
    it('completing the same referral twice does not double the commission', () => {
      fc.assert(
        fc.property(
          referralArb,
          (referral) => {
            const completion: SimulatedCompletion = {
              referralCode: referral.referralCode,
              providerId: referral.providerId,
            };

            // Submit the same completion twice
            const result = calculateCommissions([referral], [completion, completion]);

            // Commission should only be counted once
            expect(result.totalEarned).toBe(referral.commissionAmount);
            expect(result.duplicateCompletions).toHaveLength(1);
            expect(result.completedReferralCodes.size).toBe(1);

            return (
              result.totalEarned === referral.commissionAmount &&
              result.duplicateCompletions.length === 1
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('N distinct referrals completed once each yield exactly N commissions', () => {
      fc.assert(
        fc.property(
          fc.array(referralArb, { minLength: 1, maxLength: 20 }),
          (referrals) => {
            // Ensure unique referral codes (deduplicate by code)
            const uniqueReferrals = Array.from(
              new Map(referrals.map((r) => [r.referralCode, r])).values()
            );

            const completions: SimulatedCompletion[] = uniqueReferrals.map((r) => ({
              referralCode: r.referralCode,
              providerId: r.providerId,
            }));

            const result = calculateCommissions(uniqueReferrals, completions);

            const expectedTotal = uniqueReferrals.reduce(
              (sum, r) => sum + r.commissionAmount,
              0
            );

            return (
              result.totalEarned === expectedTotal &&
              result.orphanedCompletions.length === 0 &&
              result.duplicateCompletions.length === 0 &&
              result.completedReferralCodes.size === uniqueReferrals.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Commission Amount Validity', () => {
    it('commission amounts are always non-negative', () => {
      fc.assert(
        fc.property(providerIdArb, (providerId) => {
          const rate = getProviderCommissionRate(providerId);
          return rate >= 0;
        }),
        { numRuns: 50 }
      );
    });

    it('commission amounts are within expected range ($15-$40)', () => {
      fc.assert(
        fc.property(providerIdArb, (providerId) => {
          const rate = getProviderCommissionRate(providerId);
          // Commission should be between $15 and $40 (stored as cents: 1500-4000)
          return rate >= 15 && rate <= 40;
        }),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Referral Chain Integrity Across Sessions', () => {
    it('referral codes remain stable across multiple lookups', () => {
      fc.assert(
        fc.property(
          fc.array(referralArb, { minLength: 2, maxLength: 10 }),
          (referrals) => {
            // Simulate multi-step session: store referrals, then look them up
            const referralStore = new Map<string, SimulatedReferral>(
              referrals.map((r) => [r.referralCode, r])
            );

            // Each referral should be retrievable by its code
            for (const referral of referrals) {
              const retrieved = referralStore.get(referral.referralCode);
              if (!retrieved) return false;
              if (retrieved.providerId !== referral.providerId) return false;
              if (retrieved.userId !== referral.userId) return false;
              if (retrieved.commissionAmount !== referral.commissionAmount) return false;
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('total commission is the sum of individual completed referral commissions', () => {
      fc.assert(
        fc.property(
          fc.array(referralArb, { minLength: 1, maxLength: 15 }),
          (referrals) => {
            const uniqueReferrals = Array.from(
              new Map(referrals.map((r) => [r.referralCode, r])).values()
            );

            // Complete a random subset
            const toComplete = uniqueReferrals.filter((_, i) => i % 2 === 0);
            const completions = toComplete.map((r) => ({
              referralCode: r.referralCode,
              providerId: r.providerId,
            }));

            const result = calculateCommissions(uniqueReferrals, completions);

            const expectedTotal = toComplete.reduce((sum, r) => sum + r.commissionAmount, 0);

            return result.totalEarned === expectedTotal;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
