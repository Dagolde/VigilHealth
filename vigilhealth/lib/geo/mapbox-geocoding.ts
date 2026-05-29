/**
 * Mapbox Geocoding API client
 * 
 * Provides forward geocoding (address/city/ZIP → coordinates) and
 * reverse geocoding (coordinates → address) using Mapbox Geocoding API.
 */

export interface GeocodingResult {
  id: string;
  placeName: string;
  text: string;
  center: [number, number]; // [lng, lat]
  placeType: string[];
  relevance: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface GeocodingOptions {
  country?: string; // ISO 3166-1 alpha-2 country code (e.g., 'US')
  types?: string[]; // place types to filter (e.g., ['place', 'locality', 'address'])
  limit?: number; // max results, default 5
  proximity?: [number, number]; // [lng, lat] to bias results
  bbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
}

export interface ReverseGeocodingOptions {
  types?: string[]; // place types to filter
  limit?: number; // max results, default 1
}

/**
 * Forward geocode: convert address/city/ZIP to coordinates
 * 
 * @param query - Search query (address, city, ZIP code, etc.)
 * @param options - Geocoding options
 * @returns Promise resolving to array of geocoding results
 * @throws Error if geocoding fails
 */
export async function geocode(
  query: string,
  options: GeocodingOptions = {}
): Promise<GeocodingResult[]> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken || mapboxToken === 'your_mapbox_public_token_here') {
    throw new Error('Mapbox token not configured');
  }

  if (!query.trim()) {
    return [];
  }

  // Build query parameters
  const params = new URLSearchParams({
    access_token: mapboxToken,
  });

  if (options.country) {
    params.append('country', options.country);
  }

  if (options.types && options.types.length > 0) {
    params.append('types', options.types.join(','));
  }

  if (options.limit) {
    params.append('limit', options.limit.toString());
  }

  if (options.proximity) {
    params.append('proximity', options.proximity.join(','));
  }

  if (options.bbox) {
    params.append('bbox', options.bbox.join(','));
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data.features || []).map((feature: any) => parseGeocodingFeature(feature));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Geocoding failed: ${error.message}`);
    }
    throw new Error('Geocoding failed: Unknown error');
  }
}

/**
 * Reverse geocode: convert coordinates to human-readable address
 * 
 * @param lng - Longitude
 * @param lat - Latitude
 * @param options - Reverse geocoding options
 * @returns Promise resolving to array of geocoding results
 * @throws Error if reverse geocoding fails
 */
export async function reverseGeocode(
  lng: number,
  lat: number,
  options: ReverseGeocodingOptions = {}
): Promise<GeocodingResult[]> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!mapboxToken || mapboxToken === 'your_mapbox_public_token_here') {
    throw new Error('Mapbox token not configured');
  }

  // Validate coordinates
  if (lat < -90 || lat > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90');
  }

  if (lng < -180 || lng > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180');
  }

  // Build query parameters
  const params = new URLSearchParams({
    access_token: mapboxToken,
  });

  if (options.types && options.types.length > 0) {
    params.append('types', options.types.join(','));
  }

  if (options.limit) {
    params.append('limit', options.limit.toString());
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Reverse geocoding request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return (data.features || []).map((feature: any) => parseGeocodingFeature(feature));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Reverse geocoding failed: ${error.message}`);
    }
    throw new Error('Reverse geocoding failed: Unknown error');
  }
}

/**
 * Parse a Mapbox geocoding feature into a GeocodingResult
 * 
 * @param feature - Raw Mapbox feature object
 * @returns Parsed GeocodingResult
 */
function parseGeocodingFeature(feature: any): GeocodingResult {
  const result: GeocodingResult = {
    id: feature.id,
    placeName: feature.place_name,
    text: feature.text || '',
    center: feature.center,
    placeType: feature.place_type || [],
    relevance: feature.relevance || 0,
  };

  // Extract address components from context
  if (feature.context) {
    for (const ctx of feature.context) {
      if (ctx.id.startsWith('place.')) {
        result.city = ctx.text;
      } else if (ctx.id.startsWith('region.')) {
        result.state = ctx.text;
      } else if (ctx.id.startsWith('country.')) {
        result.country = ctx.text;
      } else if (ctx.id.startsWith('postcode.')) {
        result.zipCode = ctx.text;
      }
    }
  }

  // If the feature itself is a place (city), use it
  if (feature.place_type.includes('place') && !result.city) {
    result.city = feature.text;
  }

  // Extract address if available
  if (feature.address) {
    result.address = `${feature.address} ${feature.text}`;
  } else if (feature.place_type.includes('address')) {
    result.address = feature.text;
  }

  return result;
}

/**
 * Get a single best result from geocoding
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
 * Get a single best result from reverse geocoding
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
