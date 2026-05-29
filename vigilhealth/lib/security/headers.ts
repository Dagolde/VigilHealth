/**
 * Security Headers Configuration
 *
 * Defines security headers to be applied to all responses.
 * Applied in next.config.mjs via the headers() function.
 */

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Core security headers for all routes.
 */
export const SECURITY_HEADERS: SecurityHeader[] = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://app.posthog.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://app.posthog.com https://api.resend.com",
      "font-src 'self'",
      "frame-src https://js.stripe.com",
      "worker-src 'self' blob:",
    ].join('; '),
  },
];

/**
 * Get security headers as a Next.js headers config array.
 */
export function getSecurityHeadersConfig(): Array<{
  source: string;
  headers: SecurityHeader[];
}> {
  return [
    {
      source: '/(.*)',
      headers: SECURITY_HEADERS,
    },
  ];
}
