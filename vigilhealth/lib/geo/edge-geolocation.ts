/**
 * Edge-resolved geolocation using Vercel's geo request headers
 * 
 * Vercel automatically adds geo headers to requests at the edge:
 * - x-vercel-ip-city
 * - x-vercel-ip-country
 * - x-vercel-ip-country-region
 * - x-vercel-ip-latitude
 * - x-vercel-ip-longitude
 */

export interface EdgeGeoLocation {
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Extract geolocation from Vercel edge request headers
 * 
 * @param headers - Request headers object
 * @returns EdgeGeoLocation object with parsed geo data
 */
export function getEdgeGeolocation(headers: Headers): EdgeGeoLocation {
  const city = headers.get('x-vercel-ip-city');
  const region = headers.get('x-vercel-ip-country-region');
  const country = headers.get('x-vercel-ip-country');
  const latStr = headers.get('x-vercel-ip-latitude');
  const lngStr = headers.get('x-vercel-ip-longitude');

  // Parse coordinates
  const lat = latStr ? parseFloat(latStr) : null;
  const lng = lngStr ? parseFloat(lngStr) : null;

  // Validate coordinates
  const validLat = lat !== null && !isNaN(lat) && lat >= -90 && lat <= 90 ? lat : null;
  const validLng = lng !== null && !isNaN(lng) && lng >= -180 && lng <= 180 ? lng : null;

  return {
    city: city ? decodeURIComponent(city) : null,
    region: region ? decodeURIComponent(region) : null,
    country: country ? decodeURIComponent(country) : null,
    lat: validLat,
    lng: validLng,
  };
}

/**
 * Check if edge geolocation data is available and valid
 * 
 * @param geoLocation - EdgeGeoLocation object to validate
 * @returns true if geolocation has valid coordinates
 */
export function hasValidEdgeGeolocation(geoLocation: EdgeGeoLocation): boolean {
  return geoLocation.lat !== null && geoLocation.lng !== null;
}

/**
 * Format edge geolocation as a human-readable string
 * 
 * @param geoLocation - EdgeGeoLocation object to format
 * @returns Formatted location string (e.g., "Seattle, WA, US")
 */
export function formatEdgeGeolocation(geoLocation: EdgeGeoLocation): string {
  const parts: string[] = [];

  if (geoLocation.city) parts.push(geoLocation.city);
  if (geoLocation.region) parts.push(geoLocation.region);
  if (geoLocation.country) parts.push(geoLocation.country);

  return parts.length > 0 ? parts.join(', ') : 'Unknown location';
}
