/**
 * Browser Geolocation API with permission handling
 * 
 * Provides a Promise-based wrapper around the browser's Geolocation API
 * with proper error handling and permission management.
 */

export interface BrowserGeoLocation {
  lat: number;
  lng: number;
  accuracy: number; // meters
  timestamp: number;
}

export type GeolocationErrorType =
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout'
  | 'not_supported'
  | 'unknown';

export class GeolocationError extends Error {
  constructor(
    public type: GeolocationErrorType,
    message: string
  ) {
    super(message);
    this.name = 'GeolocationError';
  }
}

export interface GeolocationOptions {
  timeout?: number; // milliseconds, default 10000
  maximumAge?: number; // milliseconds, default 0
  enableHighAccuracy?: boolean; // default false
}

/**
 * Check if the browser supports the Geolocation API
 * 
 * @returns true if geolocation is supported
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Get the current position using the browser's Geolocation API
 * 
 * @param options - Geolocation options
 * @returns Promise resolving to BrowserGeoLocation
 * @throws GeolocationError if geolocation fails
 */
export async function getCurrentPosition(
  options: GeolocationOptions = {}
): Promise<BrowserGeoLocation> {
  if (!isGeolocationSupported()) {
    throw new GeolocationError(
      'not_supported',
      'Geolocation is not supported by your browser'
    );
  }

  const {
    timeout = 10000,
    maximumAge = 0,
    enableHighAccuracy = false,
  } = options;

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorType: GeolocationErrorType;
        let errorMessage: string;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = 'permission_denied';
            errorMessage =
              'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorType = 'position_unavailable';
            errorMessage =
              'Location information is unavailable. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorType = 'timeout';
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorType = 'unknown';
            errorMessage = 'An unknown error occurred while getting your location.';
        }

        reject(new GeolocationError(errorType, errorMessage));
      },
      {
        timeout,
        maximumAge,
        enableHighAccuracy,
      }
    );
  });
}

/**
 * Watch the user's position for changes
 * 
 * @param callback - Function called when position changes
 * @param errorCallback - Function called on error
 * @param options - Geolocation options
 * @returns Watch ID that can be used to clear the watch
 */
export function watchPosition(
  callback: (position: BrowserGeoLocation) => void,
  errorCallback: (error: GeolocationError) => void,
  options: GeolocationOptions = {}
): number | null {
  if (!isGeolocationSupported()) {
    errorCallback(
      new GeolocationError(
        'not_supported',
        'Geolocation is not supported by your browser'
      )
    );
    return null;
  }

  const {
    timeout = 10000,
    maximumAge = 0,
    enableHighAccuracy = false,
  } = options;

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      let errorType: GeolocationErrorType;
      let errorMessage: string;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorType = 'permission_denied';
          errorMessage = 'Location permission denied.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorType = 'position_unavailable';
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorType = 'timeout';
          errorMessage = 'Location request timed out.';
          break;
        default:
          errorType = 'unknown';
          errorMessage = 'An unknown error occurred.';
      }

      errorCallback(new GeolocationError(errorType, errorMessage));
    },
    {
      timeout,
      maximumAge,
      enableHighAccuracy,
    }
  );
}

/**
 * Clear a position watch
 * 
 * @param watchId - Watch ID returned by watchPosition
 */
export function clearWatch(watchId: number): void {
  if (isGeolocationSupported()) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Check geolocation permission status (if supported by browser)
 * 
 * @returns Promise resolving to permission state or null if not supported
 */
export async function checkGeolocationPermission(): Promise<PermissionState | null> {
  if (!('permissions' in navigator)) {
    return null;
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    // Some browsers don't support querying geolocation permission
    return null;
  }
}
