/**
 * Input Sanitization Utility
 *
 * Sanitizes user-submitted input to prevent XSS and injection attacks.
 */

// ─── HTML Sanitization ────────────────────────────────────────────────────────

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strip all HTML tags from a string.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

// ─── String Sanitization ──────────────────────────────────────────────────────

/**
 * Sanitize a plain text string:
 * - Trim whitespace
 * - Strip HTML tags
 * - Normalize whitespace (collapse multiple spaces/newlines)
 */
export function sanitizeText(input: string): string {
  return stripHtml(input.trim()).replace(/\s+/g, ' ');
}

/**
 * Sanitize a multiline text field (preserves single newlines).
 */
export function sanitizeMultilineText(input: string): string {
  return stripHtml(input.trim())
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/[ \t]+/g, ' '); // Collapse horizontal whitespace
}

/**
 * Sanitize a URL — only allow http/https protocols.
 */
export function sanitizeUrl(input: string): string | null {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize an email address.
 */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Sanitize a phone number — keep only digits, +, -, (, ), and spaces.
 */
export function sanitizePhone(input: string): string {
  return input.replace(/[^0-9+\-() ]/g, '').trim();
}

/**
 * Sanitize a search query — remove special characters that could cause issues.
 */
export function sanitizeSearchQuery(input: string): string {
  return input
    .trim()
    .replace(/[<>'"`;\\]/g, '')
    .slice(0, 200); // Max 200 chars
}

// ─── Object Sanitization ──────────────────────────────────────────────────────

/**
 * Recursively sanitize all string values in an object.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
