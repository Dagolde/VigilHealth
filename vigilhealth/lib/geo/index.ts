/**
 * Geolocation services
 * 
 * Provides comprehensive geolocation functionality including:
 * - Edge-resolved geolocation (Vercel geo headers)
 * - Browser Geolocation API with permission handling
 * - Mapbox geocoding (forward and reverse)
 * - Geocoding result caching (24-hour TTL)
 * - Distance calculations (Haversine formula)
 */

// Edge geolocation
export {
  getEdgeGeolocation,
  hasValidEdgeGeolocation,
  formatEdgeGeolocation,
  type EdgeGeoLocation,
} from './edge-geolocation';

// Browser geolocation
export {
  isGeolocationSupported,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  checkGeolocationPermission,
  GeolocationError,
  type BrowserGeoLocation,
  type GeolocationErrorType,
  type GeolocationOptions,
} from './browser-geolocation';

// Cached geocoding (recommended for most use cases)
export {
  geocode,
  reverseGeocode,
  geocodeSingle,
  reverseGeocodeSingle,
} from './cached-geocoding';

// Direct geocoding (without cache)
export {
  geocode as geocodeUncached,
  reverseGeocode as reverseGeocodeUncached,
  geocodeSingle as geocodeSingleUncached,
  reverseGeocodeSingle as reverseGeocodeSingleUncached,
  type GeocodingResult,
  type GeocodingOptions,
  type ReverseGeocodingOptions,
} from './mapbox-geocoding';

// Cache management
export {
  clearGeocodingCache,
  pruneGeocodingCache,
  getGeocodingCacheStats,
} from './geocoding-cache';

// Distance calculations
export {
  calculateDistance,
  calculateDistanceKm,
  calculateDistanceMiles,
  isWithinRadius,
  sortByDistance,
  filterByRadius,
  findNearest,
  calculateBoundingBox,
  type Coordinates,
} from './distance';
