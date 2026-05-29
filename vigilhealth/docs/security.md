# VigilHealth Security Documentation

## TLS Configuration

### Phase 1 (Vercel)

TLS 1.3 is automatically enforced by Vercel for all deployments. No additional configuration is required. Vercel:

- Automatically provisions and renews SSL/TLS certificates via Let's Encrypt
- Enforces TLS 1.2 minimum (TLS 1.3 preferred)
- Applies HSTS headers with `max-age=63072000; includeSubDomains; preload`
- Handles certificate rotation transparently

### Phase 2 (CloudPanel / Nginx)

When migrating to CloudPanel, configure Nginx with TLS 1.3:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
```

See `deploy/nginx.conf` for the full Nginx configuration template.

## Security Headers

Security headers are configured in `lib/security/headers.ts` and applied via `next.config.mjs`. Headers include:

- `X-Frame-Options: DENY` — Prevents clickjacking
- `X-Content-Type-Options: nosniff` — Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` — Legacy XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — Restricts camera, microphone access
- `Strict-Transport-Security` — Enforces HTTPS
- `Content-Security-Policy` — Restricts resource loading

## CSRF Protection

CSRF protection is implemented in `lib/security/csrf.ts` using the Double Submit Cookie pattern. All state-changing API routes (POST, PUT, DELETE, PATCH) validate the CSRF token.

## Rate Limiting

Rate limiting is implemented in `lib/security/rate-limiter.ts`:

- Default: 5 requests/second per IP
- Email sending: 100 emails/day (Resend free tier)
- Notifications: 3 per day per user (bypass for critical alerts)

For production, replace the in-memory store with Upstash Redis.

## Input Sanitization

All user-submitted input is sanitized via `lib/security/sanitize.ts`:

- HTML tags stripped to prevent XSS
- URLs validated to allow only http/https
- Search queries limited to 200 characters
- Phone numbers restricted to valid characters

## Automated Security Scanning

See `.snyk` for Snyk configuration. Run weekly scans via:

```bash
npx snyk test
npx snyk monitor
```

## Data Encryption

- **At rest**: Supabase AES-256 encryption for all data
- **In transit**: TLS 1.3 (Vercel/Nginx)
- **Employee health data**: Anonymized employee IDs, 90-day retention
- **Phase 2**: pgcrypto column-level encryption for sensitive health fields

See `lib/business/data-encryption.ts` for implementation details.
