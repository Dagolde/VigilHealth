/**
 * Property-based tests for distance calculations
 * 
 * **Validates: Requirements 24**
 * 
 * Tests the following properties:
 * 1. Symmetry: dist(A,B) === dist(B,A)
 * 2. Triangle inequality: dist(A,C) <= dist(A,B) + dist(B,C)
 * 3. Non-negativity: dist(A,B) >= 0
 * 4. Identity: dist(A,A) === 0
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  calculateDistance,
  calculateDistanceKm,
  calculateDistanceMiles,
  type Coordinates,
} from '../distance';

/**
 * Arbitrary generator for valid latitude values (-90 to 90)
 */
const latitudeArbitrary = fc.double({ min: -90, max: 90, noNaN: true });

/**
 * Arbitrary generator for valid longitude values (-180 to 180)
 */
const longitudeArbitrary = fc.double({ min: -180, max: 180, noNaN: true });

/**
 * Arbitrary generator for valid coordinate pairs
 */
const coordinatesArbitrary: fc.Arbitrary<Coordinates> = fc.record({
  lat: latitudeArbitrary,
  lng: longitudeArbitrary,
});

describe('Distance Calculation Properties', () => {
  describe('Property: Symmetry - dist(A,B) === dist(B,A)', () => {
    it('should satisfy symmetry property for all coordinate pairs (miles)', () => {
      fc.assert(
        fc.property(coordinatesArbitrary, coordinatesArbitrary, (pointA, pointB) => {
          const distAB = calculateDistanceMiles(pointA, pointB);
          const distBA = calculateDistanceMiles(pointB, pointA);

          // Allow for small floating-point precision errors
          const epsilon = 1e-10;
          expect(Math.abs(distAB - distBA)).toBeLessThan(epsilon);
        }),
        { numRuns: 1000 }
      );
    });

    it('should satisfy symmetry property for all coordinate pairs (km)', () => {
      fc.assert(
        fc.property(coordinatesArbitrary, coordinatesArbitrary, (pointA, pointB) => {
          const distAB = calculateDistanceKm(pointA, pointB);
          const distBA = calculateDistanceKm(pointB, pointA);

          // Allow for small floating-point precision errors
          const epsilon = 1e-10;
          expect(Math.abs(distAB - distBA)).toBeLessThan(epsilon);
        }),
        { numRuns: 1000 }
      );
    });

    it('should satisfy symmetry property with generic calculateDistance function', () => {
      fc.assert(
        fc.property(
          coordinatesArbitrary,
          coordinatesArbitrary,
          fc.constantFrom('km' as const, 'miles' as const),
          (pointA, pointB, unit) => {
            const distAB = calculateDistance(pointA, pointB, unit);
            const distBA = calculateDistance(pointB, pointA, unit);

            const epsilon = 1e-10;
            expect(Math.abs(distAB - distBA)).toBeLessThan(epsilon);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property: Triangle Inequality - dist(A,C) <= dist(A,B) + dist(B,C)', () => {
    it('should satisfy triangle inequality for all coordinate triples (miles)', () => {
      fc.assert(
        fc.property(
          coordinatesArbitrary,
          coordinatesArbitrary,
          coordinatesArbitrary,
          (pointA, pointB, pointC) => {
            const distAC = calculateDistanceMiles(pointA, pointC);
            const distAB = calculateDistanceMiles(pointA, pointB);
            const distBC = calculateDistanceMiles(pointB, pointC);

            // Triangle inequality: dist(A,C) <= dist(A,B) + dist(B,C)
            // Use a combined absolute and relative epsilon
            // For very small distances, absolute error dominates
            // For large distances, relative error dominates
            const maxDist = Math.max(distAC, distAB + distBC);
            const epsilon = Math.max(1e-10, maxDist * 1e-5);
            expect(distAC).toBeLessThanOrEqual(distAB + distBC + epsilon);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('should satisfy triangle inequality for all coordinate triples (km)', () => {
      fc.assert(
        fc.property(
          coordinatesArbitrary,
          coordinatesArbitrary,
          coordinatesArbitrary,
          (pointA, pointB, pointC) => {
            const distAC = calculateDistanceKm(pointA, pointC);
            const distAB = calculateDistanceKm(pointA, pointB);
            const distBC = calculateDistanceKm(pointB, pointC);

            // Use a combined absolute and relative epsilon
            const maxDist = Math.max(distAC, distAB + distBC);
            const epsilon = Math.max(1e-10, maxDist * 1e-5);
            expect(distAC).toBeLessThanOrEqual(distAB + distBC + epsilon);
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('should satisfy triangle inequality with generic calculateDistance function', () => {
      fc.assert(
        fc.property(
          coordinatesArbitrary,
          coordinatesArbitrary,
          coordinatesArbitrary,
          fc.constantFrom('km' as const, 'miles' as const),
          (pointA, pointB, pointC, unit) => {
            const distAC = calculateDistance(pointA, pointC, unit);
            const distAB = calculateDistance(pointA, pointB, unit);
            const distBC = calculateDistance(pointB, pointC, unit);

            // Use a combined absolute and relative epsilon
            const maxDist = Math.max(distAC, distAB + distBC);
            const epsilon = Math.max(1e-10, maxDist * 1e-5);
            expect(distAC).toBeLessThanOrEqual(distAB + distBC + epsilon);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property: Non-negativity - dist(A,B) >= 0', () => {
    it('should always return non-negative distances (miles)', () => {
      fc.assert(
        fc.property(coordinatesArbitrary, coordinatesArbitrary, (pointA, pointB) => {
          const distance = calculateDistanceMiles(pointA, pointB);
          expect(distance).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 1000 }
      );
    });

    it('should always return non-negative distances (km)', () => {
      fc.assert(
        fc.property(coordinatesArbitrary, coordinatesArbitrary, (pointA, pointB) => {
          const distance = calculateDistanceKm(pointA, pointB);
          expect(distance).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property: Identity - dist(A,A) === 0', () => {
    it('should return zero distance for identical points (miles)', () => {
      fc.assert(
        fc.property(coordinatesArbitrary, (point) => {
          const distance = calculateDistanceMiles(point, point);
          expect(distance).toBe(0);
        }),
        { numRuns: 1000 }
      );
    });

    it('should return zero distance for identical points (km)', () => {
      fc.assert(
        fc.property(coordinatesArbitrary, (point) => {
          const distance = calculateDistanceKm(point, point);
          expect(distance).toBe(0);
        }),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property: Unit Conversion Consistency', () => {
    it('should maintain consistent ratio between km and miles', () => {
      fc.assert(
        fc.property(coordinatesArbitrary, coordinatesArbitrary, (pointA, pointB) => {
          const distKm = calculateDistanceKm(pointA, pointB);
          const distMiles = calculateDistanceMiles(pointA, pointB);

          // 1 mile = 1.60934 km
          const expectedMiles = distKm / 1.60934;

          // Use a combined absolute and relative epsilon
          // For very small distances, absolute error dominates due to floating-point precision
          // The error can be slightly larger than the value itself for extremely small distances
          const epsilon = Math.max(2e-6, Math.abs(expectedMiles) * 1e-4);
          expect(Math.abs(distMiles - expectedMiles)).toBeLessThan(epsilon);
        }),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property: Commutativity of Addition in Triangle Inequality', () => {
    it('should satisfy dist(A,C) <= dist(A,B) + dist(B,C) === dist(B,C) + dist(A,B)', () => {
      fc.assert(
        fc.property(
          coordinatesArbitrary,
          coordinatesArbitrary,
          coordinatesArbitrary,
          (pointA, pointB, pointC) => {
            const distAC = calculateDistanceMiles(pointA, pointC);
            const distAB = calculateDistanceMiles(pointA, pointB);
            const distBC = calculateDistanceMiles(pointB, pointC);

            const sum1 = distAB + distBC;
            const sum2 = distBC + distAB;

            // Sums should be equal (commutativity)
            expect(sum1).toBe(sum2);

            // Both should satisfy triangle inequality
            // Use a combined absolute and relative epsilon
            const maxDist = Math.max(distAC, sum1);
            const epsilon = Math.max(1e-10, maxDist * 1e-5);
            expect(distAC).toBeLessThanOrEqual(sum1 + epsilon);
            expect(distAC).toBeLessThanOrEqual(sum2 + epsilon);
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property: Degenerate Triangle (Collinear Points)', () => {
    it('should handle collinear points correctly', () => {
      // Constrain coordinates away from the antimeridian (lng ±180) and poles (lat ±90)
      // to avoid floating-point divergence in spherical interpolation.
      // Linear interpolation in lat/lng space only approximates a geodesic arc;
      // near the antimeridian the error grows beyond any reasonable epsilon.
      const safeCoordinatesArbitrary = fc.record({
        lat: fc.double({ min: -80, max: 80, noNaN: true }),
        lng: fc.double({ min: -170, max: 170, noNaN: true }),
      });

      fc.assert(
        fc.property(
          safeCoordinatesArbitrary,
          safeCoordinatesArbitrary,
          fc.double({ min: 0, max: 1, noNaN: true }),
          (pointA, pointB, t) => {
            // Create a point C that lies on the line between A and B
            const pointC: Coordinates = {
              lat: pointA.lat + t * (pointB.lat - pointA.lat),
              lng: pointA.lng + t * (pointB.lng - pointA.lng),
            };

            const distAB = calculateDistanceMiles(pointA, pointB);
            const distAC = calculateDistanceMiles(pointA, pointC);
            const distCB = calculateDistanceMiles(pointC, pointB);

            // For collinear points: dist(A,B) ≈ dist(A,C) + dist(C,B)
            // Use a generous relative epsilon — linear lat/lng interpolation is only
            // an approximation of the great-circle arc, so some deviation is expected.
            const maxDist = Math.max(distAB, distAC + distCB);
            const epsilon = Math.max(1e-4, maxDist * 0.02); // 2% relative tolerance
            expect(Math.abs(distAB - (distAC + distCB))).toBeLessThan(epsilon);
          }
        ),
        { numRuns: 500 }
      );
    });
  });
});
