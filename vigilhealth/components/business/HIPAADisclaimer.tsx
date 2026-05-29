/**
 * HIPAA Compliance Disclaimer Component
 *
 * Displays a HIPAA compliance notice for the Business Dashboard.
 * Must be shown on all pages that handle employee health data.
 */

interface HIPAADisclaimerProps {
  compact?: boolean;
}

export function HIPAADisclaimer({ compact = false }: HIPAADisclaimerProps) {
  if (compact) {
    return (
      <div className="rounded-md bg-blue-50 px-3 py-2 border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>HIPAA Notice:</strong> Employee health data is protected under HIPAA.
          All data is encrypted and access is logged.{' '}
          <a href="/docs/privacy" className="underline hover:no-underline">
            Privacy Policy
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-blue-50 p-5 border border-blue-200">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">🔒</span>
        <div>
          <h3 className="font-semibold text-blue-900 mb-2">HIPAA Compliance Notice</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              This Business Dashboard handles Protected Health Information (PHI) subject to the
              Health Insurance Portability and Accountability Act (HIPAA).
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>All employee health data is encrypted at rest (AES-256) and in transit (TLS 1.3)</li>
              <li>Access to health data is logged for audit purposes</li>
              <li>Employee data is anonymized — individual identities are not disclosed to employers</li>
              <li>Data is retained for 90 days and then automatically deleted</li>
              <li>Employees have the right to view and delete their own data</li>
              <li>Data is never sold or shared with third parties</li>
            </ul>
            <p className="mt-3">
              By using this dashboard, you agree to our{' '}
              <a href="/docs/hipaa-baa" className="underline hover:no-underline font-medium">
                Business Associate Agreement (BAA)
              </a>{' '}
              and{' '}
              <a href="/docs/privacy" className="underline hover:no-underline font-medium">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
