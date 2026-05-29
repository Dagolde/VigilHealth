/**
 * Unit tests for content-filter.ts
 */

import { describe, expect, it } from 'vitest';

import { containsBlockedTerms, filterContent, isSpam } from '../content-filter';

describe('containsBlockedTerms', () => {
  it('returns false for a normal health-related description', () => {
    expect(containsBlockedTerms('I noticed several people coughing near the park.')).toBe(false);
  });

  it('returns true when a blocked term is present', () => {
    expect(containsBlockedTerms('This is badword1 content')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(containsBlockedTerms('This is BADWORD1 content')).toBe(true);
  });

  it('returns false for normal descriptions without blocked terms', () => {
    expect(containsBlockedTerms('Pharmacy on Main Street is out of masks.')).toBe(false);
  });
});

describe('isSpam', () => {
  it('returns false for a valid health-related description', () => {
    expect(isSpam('Noticed increased flu-like symptoms in the neighborhood this week.')).toBe(false);
  });

  it('returns true for repeated characters (5+ same chars in a row)', () => {
    expect(isSpam('This is aaaaaaa spam content here')).toBe(true);
  });

  it('returns true for ALL CAPS text (>80% uppercase, >20 chars)', () => {
    expect(isSpam('THIS IS ALL CAPS CONTENT THAT IS VERY LONG')).toBe(true);
  });

  it('returns false for short all-caps text (<=20 chars)', () => {
    // "HELLO WORLD" is 11 chars — under the 20-char threshold
    expect(isSpam('HELLO WORLD TESTING!')).toBe(false);
  });

  it('returns true for URLs with http://', () => {
    expect(isSpam('Check out http://example.com for more info about symptoms')).toBe(true);
  });

  it('returns true for URLs with https://', () => {
    expect(isSpam('Visit https://example.com for health information and updates')).toBe(true);
  });

  it('returns true for URLs with www.', () => {
    expect(isSpam('Go to www.example.com for more details about this outbreak')).toBe(true);
  });

  it('returns true for descriptions shorter than 10 characters', () => {
    expect(isSpam('Short')).toBe(true);
  });

  it('returns false for a normal description with mixed case', () => {
    expect(isSpam('Pharmacy on Oak Street ran out of hand sanitizer yesterday.')).toBe(false);
  });
});

describe('filterContent', () => {
  it('allows a valid health-related description', () => {
    const result = filterContent('Noticed several people with flu-like symptoms near the community center.');
    expect(result.isAllowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('blocks descriptions with repeated characters', () => {
    const result = filterContent('This is aaaaaaa spam content that should be blocked');
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('blocks ALL CAPS text (>80% uppercase, >20 chars)', () => {
    const result = filterContent('THIS IS ALL CAPS CONTENT THAT IS VERY LONG AND SHOULD BE BLOCKED');
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('blocks descriptions containing URLs', () => {
    const result = filterContent('Check out https://example.com for more information about this health issue');
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('blocks short descriptions (< 10 chars)', () => {
    const result = filterContent('Short');
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('allows normal descriptions that pass all checks', () => {
    const result = filterContent('The local pharmacy on Elm Street has run out of N95 masks.');
    expect(result.isAllowed).toBe(true);
  });

  it('blocks descriptions containing blocked terms', () => {
    const result = filterContent('This is badword1 content that should not be allowed in the system');
    expect(result.isAllowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('allows a description at exactly 10 characters', () => {
    const result = filterContent('1234567890');
    expect(result.isAllowed).toBe(true);
  });
});
