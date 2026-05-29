/**
 * Cached geocoding functions
 * 
 * Wraps Mapbox geocoding with automatic caching to minimize API calls.
 */

import {
  cacheForwardGeocoding,
  cacheReverseGeocoding,
  getCachedForwardGeocoding,
  getCachedReverseGeocoding,
} from './geocoding-cache';
import {
  geocode as mapboxGeocode,
  reverseGeocode as mapboxReverseGeocode,
  type GeocodingOptions,
  type GeocodingResult,
  type ReverseGeocodingOptions,
} from './mapbox-geocoding';
/**
 * Forward geocode with caching
 * 
 * @param query - Search query
 * @param options - Geocoding options
 * @returns Promise resolving to array of geocoding results
 */
export async function geocode(
  query: string,
  options: GeocodingOptions = {}
): Promise<GeocodingResult[]> {
  // Check cache first
  const cached = getCachedForwardGeocoding(query, options);
  if (cached !== null) {
    return cached;
  }

  // Fetch from API
  const results = await mapboxGeocode(query, options);

  // Cache the results
  cacheForwardGeocoding(query, options, results);

  return results;
}

/**
 * Reverse geocode with caching
 * 
 * @param lng - Longitude
 * @param lat - Latitude
 * @param options - Reverse geocoding options
 * @returns Promise resolving to array of geocoding results
 */
export async function reverseGeocode(
  lng: number,
  lat: number,
  options: ReverseGeocodingOptions = {}
): Promise<GeocodingResult[]> {
  // Check cache first
  const cached = getCachedReverseGeocoding(lng, lat, options);
  if (cached !== null) {
    return cached;
  }

  // Fetch from API
  const results = await mapboxReverseGeocode(lng, lat, options);

  // Cache the results
  cacheReverseGeocoding(lng, lat, options, results);

  return results;
}

/**
 * Get a single best result from geocoding with caching
 * 
 * @param query - Search query
 * @param options - Geocoding options
 * @returns Promise resolving to best result or null if no results
 */
export async function geocodeSingle(
  query: string,
  options: GeocodingOptions = {}
): Promise<GeocodingResult | null> {
  const results = await geocode(query, { ...options, limit: 1 });
  return results.length > 0 ? results[0] : null;
}

/**
 * Get a single best result from reverse geocoding with caching
 * 
 * @param lng - Longitude
 * @param lat - Latitude
 * @param options - Reverse geocoding options
 * @returns Promise resolving to best result or null if no results
 */
export async function reverseGeocodeSingle(
  lng: number,
  lat: number,
  options: ReverseGeocodingOptions = {}
): Promise<GeocodingResult | null> {
  const results = await reverseGeocode(lng, lat, { ...options, limit: 1 });
  return results.length > 0 ? results[0] : null;
}
