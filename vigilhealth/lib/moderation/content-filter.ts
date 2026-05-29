/**
 * Content Filter — Profanity and Spam Detection
 *
 * Pure functions for filtering user-submitted content.
 * No external dependencies.
 * Supports configurable blocked terms loaded from admin API.
 */

export interface ContentFilterResult {
  isAllowed: boolean;
  reason?: string; // why it was blocked
}

/**
 * Default blocked terms list.
 * Can be extended at runtime via setBlockedTerms().
 * Focused on spam/abuse patterns for a health app context.
 */
let BLOCKED_TERMS: string[] = [
  'badword1',
  'badword2',
  'spam',
  'scam',
  'click here',
  'buy now',
  'free money',
  'make money fast',
  'work from home',
  'earn cash',
  'limited offer',
  'act now',
];

/**
 * Replace the blocked terms list with a new set (admin-configurable).
 */
export function setBlockedTerms(terms: string[]): void {
  BLOCKED_TERMS = terms.map((t) => t.toLowerCase());
}

/**
 * Add additional terms to the blocked list.
 */
export function addBlockedTerms(terms: string[]): void {
  const newTerms = terms.map((t) => t.toLowerCase());
  BLOCKED_TERMS = [...new Set([...BLOCKED_TERMS, ...newTerms])];
}

/**
 * Get the current blocked terms list.
 */
export function getBlockedTerms(): string[] {
  return [...BLOCKED_TERMS];
}

/**
 * Check if text contains any blocked terms (case-insensitive).
 */
export function containsBlockedTerms(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}

/**
 * Check if text contains any of the provided custom terms (case-insensitive).
 */
export function containsCustomTerms(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

/**
 * Check for spam patterns:
 * - Repeated characters (5+ same chars in a row)
 * - ALL CAPS text (>80% uppercase in text >20 chars)
 * - URLs/links in the description
 * - Extremely short descriptions (< 10 chars)
 */
export function isSpam(text: string): boolean {
  // Too short
  if (text.length < 10) {
    return true;
  }

  // Repeated characters: 5+ same chars in a row
  if (/(.)\1{4,}/.test(text)) {
    return true;
  }

  // ALL CAPS: >80% uppercase letters in text longer than 20 chars
  if (text.length > 20) {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 0) {
      const upperCount = letters.replace(/[^A-Z]/g, '').length;
      const upperRatio = upperCount / letters.length;
      if (upperRatio > 0.8) {
        return true;
      }
    }
  }

  // URLs/links
  if (/https?:\/\//i.test(text) || /www\./i.test(text)) {
    return true;
  }

  return false;
}

/**
 * Check if content passes the filter.
 * Returns isAllowed=false with a reason if blocked.
 */
export function filterContent(text: string): ContentFilterResult {
  // Check length first
  if (text.length < 10) {
    return {
      isAllowed: false,
      reason: 'Description is too short (minimum 10 characters).',
    };
  }

  // Check spam patterns
  if (isSpam(text)) {
    // Determine specific reason
    if (/(.)\1{4,}/.test(text)) {
      return {
        isAllowed: false,
        reason: 'Content contains repeated characters and appears to be spam.',
      };
    }

    if (text.length > 20) {
      const letters = text.replace(/[^a-zA-Z]/g, '');
      if (letters.length > 0) {
        const upperCount = letters.replace(/[^A-Z]/g, '').length;
        if (upperCount / letters.length > 0.8) {
          return {
            isAllowed: false,
            reason: 'Content appears to be written in all caps.',
          };
        }
      }
    }

    if (/https?:\/\//i.test(text) || /www\./i.test(text)) {
      return {
        isAllowed: false,
        reason: 'Content contains URLs or links, which are not allowed.',
      };
    }

    return {
      isAllowed: false,
      reason: 'Content appears to be spam.',
    };
  }

  // Check blocked terms
  if (containsBlockedTerms(text)) {
    return {
      isAllowed: false,
      reason: 'Content contains terms that are not allowed.',
    };
  }

  return { isAllowed: true };
}
