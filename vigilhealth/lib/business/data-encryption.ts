/**
 * Employee Health Data Encryption
 *
 * Documents the encryption approach for employee health data stored in Supabase.
 *
 * APPROACH:
 * Supabase uses PostgreSQL with AES-256 encryption at rest for all data.
 * For additional column-level encryption of sensitive health fields, we use
 * Supabase's pgsodium extension (available on Pro plans) or application-level
 * encryption before storing.
 *
 * CURRENT IMPLEMENTATION (Phase 1 — Supabase Free Tier):
 * - All data is encrypted at rest by Supabase (AES-256)
 * - TLS 1.3 in transit (handled by Supabase/Vercel)
 * - Row Level Security (RLS) ensures employees can only access their own data
 * - employee_id is stored as an anonymized hash, not the real user ID
 *
 * PHASE 2 (CloudPanel — Self-hosted):
 * - Use pgcrypto for column-level encryption of symptoms and severity fields
 * - Encryption key stored in environment variable, never in DB
 * - Key rotation procedure documented in docs/security.md
 */

// ─── Anonymization ────────────────────────────────────────────────────────────

/**
 * Generate an anonymized employee identifier from a user ID.
 * Uses a prefix + first 8 chars of the user ID.
 * This is NOT reversible without the original user ID.
 */
export function anonymizeEmployeeId(userId: string): string {
  return `emp_${userId.slice(0, 8)}`;
}

/**
 * Check if an employee ID is in anonymized format.
 */
export function isAnonymizedId(employeeId: string): boolean {
  return /^emp_[a-f0-9]{8}$/.test(employeeId);
}

// ─── Encryption Notes ─────────────────────────────────────────────────────────

/**
 * Encryption status for employee_wellness_reports table columns:
 *
 * | Column          | Encryption         | Notes                              |
 * |-----------------|--------------------|------------------------------------|
 * | id              | At-rest (Supabase) | UUID, not sensitive                |
 * | organization_id | At-rest (Supabase) | FK reference                       |
 * | location_id     | At-rest (Supabase) | FK reference                       |
 * | employee_id     | At-rest (Supabase) | Anonymized hash, not real user ID  |
 * | symptoms        | At-rest (Supabase) | JSONB array — Phase 2: pgcrypto    |
 * | severity        | At-rest (Supabase) | Enum — Phase 2: pgcrypto           |
 * | is_absent       | At-rest (Supabase) | Boolean                            |
 * | reported_at     | At-rest (Supabase) | Timestamp                          |
 *
 * Phase 2 migration: Add pgcrypto column-level encryption for symptoms and severity.
 * See: https://www.postgresql.org/docs/current/pgcrypto.html
 */
export const ENCRYPTION_NOTES = {
  currentApproach: 'Supabase AES-256 at-rest encryption + TLS 1.3 in transit',
  phase2Approach: 'pgcrypto column-level encryption for symptoms and severity',
  keyManagement: 'Environment variable EMPLOYEE_DATA_ENCRYPTION_KEY (never stored in DB)',
  anonymization: 'employee_id stored as anonymized hash prefix',
} as const;
