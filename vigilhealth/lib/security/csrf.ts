/**
 * CSRF Protection Middleware
 *
 * Implements Double Submit Cookie pattern for CSRF protection.
 * For Next.js App Router API routes.
 */

import type { NextRequest } from 'next/server';

// ─── Constants ────────────────────────────────────────────────────────────────

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf_token';
const TOKEN_LENGTH = 32;

// ─── Token Generation ─────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random CSRF token.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate CSRF token from request.
 * Compares the token in the header against the token in the cookie.
 *
 * Returns true if valid, false if invalid or missing.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Skip CSRF check for safe methods
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const headerToken = request.headers.get(CSRF_HEADER);
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create a CSRF-protected response that sets the CSRF cookie.
 */
export function setCsrfCookie(
  response: Response,
  token: string
): Response {
  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    `${CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; HttpOnly=false; Secure`
  );
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
