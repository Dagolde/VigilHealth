/**
 * CDC NNDSS API Client
 * 
 * Fetches disease case report data from CDC National Notifiable Diseases Surveillance System
 * via Socrata Open Data API (data.cdc.gov).
 * Implements error handling and retry logic for resilient data fetching.
 */

export interface CDCCaseReport {
  disease: string;
  state: string;
  county?: string;
  fipsCode: string;
  caseCount: number;
  reportingWeek: string;
}

export interface CDCAPIError {
  message: string;
  statusCode?: number;
  originalError?: unknown;
}

/**
 * Fetches disease case reports from CDC NNDSS API (Socrata)
 * @param baseUrl - CDC NNDSS API base URL (defaults to env variable)
 * @param datasetId - Socrata dataset ID (defaults to NNDSS dataset)
 * @returns Array of CDC case report data
 * @throws CDCAPIError if fetch fails
 */
export async function fetchCDCData(
  baseUrl?: string,
  datasetId?: string
): Promise<CDCCaseReport[]> {
  const apiBaseUrl = baseUrl || process.env.CDC_NNDSS_BASE_URL;
  const dataset = datasetId || 'pwn4-m3yp.json'; // CDC NNDSS dataset ID

  if (!apiBaseUrl) {
    throw {
      message: 'CDC_NNDSS_BASE_URL environment variable is not set',
    } as CDCAPIError;
  }

  // Construct full API URL
  const apiUrl = `${apiBaseUrl}/${dataset}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VigilHealth/1.0',
      },
      // 15 second timeout (CDC API can be slower than WHO)
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw {
        message: `CDC NNDSS API returned status ${response.status}`,
        statusCode: response.status,
      } as CDCAPIError;
    }

    const data = await response.json();

    // Socrata returns data as an array directly
    const reports = Array.isArray(data) ? data : [];

    return reports;
  } catch (error) {
    // Handle timeout errors
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw {
        message: 'CDC NNDSS API request timed out after 15 seconds',
        originalError: error,
      } as CDCAPIError;
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw {
        message: 'Network error while fetching CDC NNDSS data',
        originalError: error,
      } as CDCAPIError;
    }

    // Re-throw if already a CDCAPIError
    if (typeof error === 'object' && error !== null && 'message' in error) {
      throw error;
    }

    // Unknown error
    throw {
      message: 'Unknown error while fetching CDC NNDSS data',
      originalError: error,
    } as CDCAPIError;
  }
}

/**
 * Fetches CDC NNDSS data with retry logic
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in ms (default: 2000)
 * @returns Array of CDC case report data
 */
export async function fetchCDCDataWithRetry(
  maxRetries = 3,
  retryDelay = 2000
): Promise<CDCCaseReport[]> {
  let lastError: CDCAPIError | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchCDCData();
    } catch (error) {
      lastError = error as CDCAPIError;

      // Don't retry on client errors (4xx)
      if (lastError.statusCode && lastError.statusCode >= 400 && lastError.statusCode < 500) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError || {
    message: 'Failed to fetch CDC NNDSS data after retries',
  } as CDCAPIError;
}
