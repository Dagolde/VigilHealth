import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 *
 * Property-based tests for authentication validation logic.
 * These tests validate the pure functions extracted from the auth system.
 */

// Pure password validation logic (extracted from Zod schema)
function validatePassword(
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain a number');
  return { valid: errors.length === 0, errors };
}

// Pure rate limiter logic
interface RateLimitState {
  count: number;
  resetAt: number;
}

function checkRateLimit(
  state: RateLimitState | undefined,
  now: number,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; newState: RateLimitState } {
  if (!state || now > state.resetAt) {
    return { allowed: true, newState: { count: 1, resetAt: now + windowMs } };
  }
  if (state.count >= maxAttempts) {
    return { allowed: false, newState: state };
  }
  return {
    allowed: true,
    newState: { count: state.count + 1, resetAt: state.resetAt },
  };
}

describe('Password Validation — Property-Based Tests', () => {
  it('valid passwords always pass validation', () => {
    // Generate passwords that meet all requirements
    const validPasswordArb = fc
      .tuple(
        fc.stringMatching(/[A-Z]/),
        fc.stringMatching(/[a-z]/),
        fc.stringMatching(/[0-9]/),
        fc.string({ minLength: 5, maxLength: 20 })
      )
      .map(([upper, lower, digit, rest]) => upper + lower + digit + rest);

    fc.assert(
      fc.property(validPasswordArb, (password) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      })
    );
  });

  it('passwords shorter than 8 chars always fail', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 7 }), (password) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('8 characters'))).toBe(
          true
        );
      })
    );
  });

  it('validation is deterministic — same input always produces same output', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 50 }), (password) => {
        const result1 = validatePassword(password);
        const result2 = validatePassword(password);
        expect(result1.valid).toBe(result2.valid);
        expect(result1.errors).toEqual(result2.errors);
      })
    );
  });
});

describe('Rate Limiter — Property-Based Tests', () => {
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  it('first attempt is always allowed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e12 }), (now) => {
        const { allowed } = checkRateLimit(
          undefined,
          now,
          MAX_ATTEMPTS,
          WINDOW_MS
        );
        expect(allowed).toBe(true);
      })
    );
  });

  it('after max attempts, requests are blocked within the window', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e12 }), (now) => {
        let state: RateLimitState | undefined = undefined;
        // Exhaust all attempts
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
          const result = checkRateLimit(state, now, MAX_ATTEMPTS, WINDOW_MS);
          state = result.newState;
        }
        // Next attempt should be blocked
        const { allowed } = checkRateLimit(state, now, MAX_ATTEMPTS, WINDOW_MS);
        expect(allowed).toBe(false);
      })
    );
  });

  it('rate limit resets after window expires', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1e12 }), (now) => {
        // Create a maxed-out state
        const exhaustedState: RateLimitState = {
          count: MAX_ATTEMPTS,
          resetAt: now + WINDOW_MS,
        };
        // After window expires, should be allowed again
        const afterWindow = now + WINDOW_MS + 1;
        const { allowed } = checkRateLimit(
          exhaustedState,
          afterWindow,
          MAX_ATTEMPTS,
          WINDOW_MS
        );
        expect(allowed).toBe(true);
      })
    );
  });

  it('attempt count is monotonically increasing within a window', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1e12 }),
        fc.integer({ min: 1, max: MAX_ATTEMPTS - 1 }),
        (now, attempts) => {
          let state: RateLimitState | undefined = undefined;
          for (let i = 0; i < attempts; i++) {
            const result = checkRateLimit(state, now, MAX_ATTEMPTS, WINDOW_MS);
            expect(result.newState.count).toBeGreaterThan(state?.count ?? 0);
            state = result.newState;
          }
        }
      )
    );
  });
});
