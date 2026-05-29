/**
 * Distance calculation utilities using the Haversine formula
 * 
 * Calculates great-circle distances between two points on Earth.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers
const EARTH_RADIUS_MILES = 3959; // Earth's radius in miles

/**
 * Convert degrees to radians
 * 
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula
 * 
 * @param point1 - First point coordinates
 * @param point2 - Second point coordinates
 * @param unit - Unit of measurement ('km' or 'miles'), default 'miles'
 * @returns Distance in the specified unit
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
  unit: 'km' | 'miles' = 'miles'
): number {
  const lat1Rad = toRadians(point1.lat);
  const lat2Rad = toRadians(point2.lat);
  const deltaLatRad = toRadians(point2.lat - point1.lat);
  const deltaLngRad = toRadians(point2.lng - point1.lng);

  // Haversine formula
  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const radius = unit === 'km' ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES;
  return radius * c;
}

/**
 * Calculate distance in kilometers
 * 
 * @param point1 - First point coordinates
 * @param point2 - Second point coordinates
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
  point1: Coordinates,
  point2: Coordinates
): number {
  return calculateDistance(point1, point2, 'km');
}

/**
 * Calculate distance in miles
 * 
 * @param point1 - First point coordinates
 * @param point2 - Second point coordinates
 * @returns Distance in miles
 */
export function calculateDistanceMiles(
  point1: Coordinates,
  point2: Coordinates
): number {
  return calculateDistance(point1, point2, 'miles');
}

/**
 * Check if a point is within a certain radius of another point
 * 
 * @param center - Center point coordinates
 * @param point - Point to check
 * @param radius - Radius in the specified unit
 * @param unit - Unit of measurement ('km' or 'miles'), default 'miles'
 * @returns true if point is within radius
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radius: number,
  unit: 'km' | 'miles' = 'miles'
): boolean {
  const distance = calculateDistance(center, point, unit);
  return distance <= radius;
}

/**
 * Sort an array of points by distance from a reference point
 * 
 * @param referencePoint - Reference point to calculate distances from
 * @param points - Array of points with coordinates
 * @param unit - Unit of measurement ('km' or 'miles'), default 'miles'
 * @returns Sorted array with distance property added
 */
export function sortByDistance<T extends Coordinates>(
  referencePoint: Coordinates,
  points: T[],
  unit: 'km' | 'miles' = 'miles'
): (T & { distance: number })[] {
  return points
    .map((point) => ({
      ...point,
      distance: calculateDistance(referencePoint, point, unit),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter points within a certain radius
 * 
 * @param center - Center point coordinates
 * @param points - Array of points to filter
 * @param radius - Radius in the specified unit
 * @param unit - Unit of measurement ('km' or 'miles'), default 'miles'
 * @returns Filtered array of points within radius
 */
export function filterByRadius<T extends Coordinates>(
  center: Coordinates,
  points: T[],
  radius: number,
  unit: 'km' | 'miles' = 'miles'
): T[] {
  return points.filter((point) => isWithinRadius(center, point, radius, unit));
}

/**
 * Find the nearest point to a reference point
 * 
 * @param referencePoint - Reference point to calculate distances from
 * @param points - Array of points to search
 * @param unit - Unit of measurement ('km' or 'miles'), default 'miles'
 * @returns Nearest point with distance, or null if array is empty
 */
export function findNearest<T extends Coordinates>(
  referencePoint: Coordinates,
  points: T[],
  unit: 'km' | 'miles' = 'miles'
): (T & { distance: number }) | null {
  if (points.length === 0) {
    return null;
  }

  const sorted = sortByDistance(referencePoint, points, unit);
  return sorted[0];
}

/**
 * Calculate the bounding box for a point with a given radius
 * 
 * @param center - Center point coordinates
 * @param radius - Radius in the specified unit
 * @param unit - Unit of measurement ('km' or 'miles'), default 'miles'
 * @returns Bounding box as [minLng, minLat, maxLng, maxLat]
 */
export function calculateBoundingBox(
  center: Coordinates,
  radius: number,
  unit: 'km' | 'miles' = 'miles'
): [number, number, number, number] {
  const radiusKm = unit === 'km' ? radius : radius * 1.60934;

  // Approximate degrees per km at this latitude
  const latDegPerKm = 1 / 110.574;
  const lngDegPerKm = 1 / (111.320 * Math.cos(toRadians(center.lat)));

  const deltaLat = radiusKm * latDegPerKm;
  const deltaLng = radiusKm * lngDegPerKm;

  return [
    center.lng - deltaLng, // minLng
    center.lat - deltaLat, // minLat
    center.lng + deltaLng, // maxLng
    center.lat + deltaLat, // maxLat
  ];
}
