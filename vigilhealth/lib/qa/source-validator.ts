/**
 * Q&A Source Validator
 *
 * Validates that cited sources come from authoritative health organizations.
 * Whitelist: WHO, CDC, NHS, NIH, Mayo Clinic, WebMD, Healthline, MedlinePlus, ECDC, PAHO
 */

// ─── Whitelist ────────────────────────────────────────────────────────────────

export const TRUSTED_DOMAINS: string[] = [
  'who.int',
  'cdc.gov',
  'nhs.uk',
  'nih.gov',
  'ncbi.nlm.nih.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'mayoclinic.org',
  'webmd.com',
  'healthline.com',
  'medlineplus.gov',
  'ecdc.europa.eu',
  'paho.org',
  'hopkinsmedicine.org',
  'clevelandclinic.org',
  'health.harvard.edu',
  'medicalnewstoday.com',
];

export const TRUSTED_ORGANIZATIONS: string[] = [
  'WHO',
  'World Health Organization',
  'CDC',
  'Centers for Disease Control',
  'NHS',
  'National Health Service',
  'NIH',
  'National Institutes of Health',
  'Mayo Clinic',
  'WebMD',
  'Healthline',
  'MedlinePlus',
  'ECDC',
  'European Centre for Disease Prevention',
  'PAHO',
  'Pan American Health Organization',
  'Johns Hopkins',
  'Cleveland Clinic',
  'Harvard Health',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SourceValidationResult {
  isValid: boolean;
  reason?: string;
  matchedDomain?: string;
  matchedOrganization?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validate a single source URL against the trusted domain whitelist.
 */
export function validateSourceUrl(url: string): SourceValidationResult {
  if (!url.trim()) {
    return { isValid: false, reason: 'Source URL is required' };
  }

  const domain = extractDomain(url);
  if (!domain) {
    return { isValid: false, reason: 'Invalid URL format' };
  }

  const matchedDomain = TRUSTED_DOMAINS.find(
    (trusted) => domain === trusted || domain.endsWith(`.${trusted}`)
  );

  if (matchedDomain) {
    return { isValid: true, matchedDomain };
  }

  return {
    isValid: false,
    reason: `Source must be from a trusted health organization. Accepted sources include: ${TRUSTED_ORGANIZATIONS.slice(0, 5).join(', ')}, and others.`,
  };
}

/**
 * Validate an array of source objects.
 * At least one valid source is required.
 */
export function validateSources(
  sources: Array<{ url: string; title?: string; organization?: string }>
): SourceValidationResult {
  if (!sources || sources.length === 0) {
    return {
      isValid: false,
      reason: 'At least one verified source citation is required',
    };
  }

  for (const source of sources) {
    const result = validateSourceUrl(source.url);
    if (result.isValid) {
      return result;
    }
  }

  return {
    isValid: false,
    reason: `None of the provided sources are from trusted health organizations. Please cite sources from WHO, CDC, NHS, NIH, or other recognized health authorities.`,
  };
}

/**
 * Get the list of trusted organization names for display.
 */
export function getTrustedOrganizations(): string[] {
  return [...TRUSTED_ORGANIZATIONS];
}
