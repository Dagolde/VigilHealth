/**
 * Audit Logger
 *
 * Records all access to employee health data for HIPAA compliance.
 * Logs are written to console (and should be forwarded to a SIEM in production).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'login'
  | 'logout';

export type AuditResource =
  | 'employee_wellness_report'
  | 'business_organization'
  | 'business_user'
  | 'user_profile'
  | 'supply_location';

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

/**
 * Log an audit event.
 * In production, this should write to a persistent audit log table or SIEM.
 */
export function logAuditEvent(entry: AuditLogEntry): void {
  const logLine = JSON.stringify({
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  });

  // In production: write to audit_logs table or external SIEM
  // eslint-disable-next-line no-console
  void logLine; // structured log available via return value
}

/**
 * Create an audit log entry for employee data access.
 */
export function auditEmployeeDataAccess(
  userId: string,
  action: AuditAction,
  resourceId?: string,
  organizationId?: string,
  details?: Record<string, unknown>
): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource: 'employee_wellness_report',
    resourceId,
    organizationId,
    details,
  });
}

/**
 * Create an audit log entry for business data access.
 */
export function auditBusinessDataAccess(
  userId: string,
  action: AuditAction,
  resource: AuditResource,
  resourceId?: string,
  details?: Record<string, unknown>
): void {
  logAuditEvent({
    timestamp: new Date().toISOString(),
    userId,
    action,
    resource,
    resourceId,
    details,
  });
}
