/**
 * Radial polygon projection for Devta zones.
 *
 * Transforms the circular Shakti Chakra rings into polygon-projected zones
 * on the floor plan boundary.
 *
 * Algorithm:
 *   1. For a given angle θ (compass: 0° = N, clockwise), cast a ray from
 *      the center to the boundary polygon.
 *   2. Find the intersection point on the boundary.
 *   3. The full ray length from center to boundary = R(θ).
 *   4. Each ring fraction [innerFrac, outerFrac] maps to
 *      [center + innerFrac * R(θ), center + outerFrac * R(θ)] along that ray.
 *   5. A devta zone is a quad/polygon with 4+ points:
 *      inner-arc (from startAngle to endAngle at innerFrac)
 *      outer-arc (from endAngle to startAngle at outerFrac)
 *
 * All coordinates are in **normalized** space (0–1), same as boundary/center.
 */

import type { Point } from "@/types/database";
import { RING_RADII, type DevtaZone } from "./devta-data";

/** Degrees → radians */
function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}

/**
 * Compass angle (0° = North, clockwise) to math angle (0° = East, counter-clockwise).
 * Konva and canvas use math convention for trig.
 */
function compassToMath(compassDeg: number): number {
  return deg2rad(90 - compassDeg);
}

/** Unit direction vector for a compass angle */
function compassDir(compassDeg: number): Point {
  const a = compassToMath(compassDeg);
  return { x: Math.cos(a), y: -Math.sin(a) };
}

/**
 * Ray–segment intersection.
 * Ray from `origin` in direction `dir`.
 * Segment from `a` to `b`.
 * Returns parameter `t` along the ray (distance = t * |dir|), or null.
 */
function raySegmentIntersect(
  origin: Point,
  dir: Point,
  a: Point,
  b: Point
): number | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const denom = dir.x * dy - dir.y * dx;
  if (Math.abs(denom) < 1e-12) return null;

  const t = ((a.x - origin.x) * dy - (a.y - origin.y) * dx) / denom;
  const u = ((a.x - origin.x) * dir.y - (a.y - origin.y) * dir.x) / denom;

  if (t > 0 && u >= 0 && u <= 1) return t;
  return null;
}

/**
 * Cast a ray from `center` at `compassDeg` and find where it hits the
 * boundary polygon. Returns the intersection point, or null if no hit.
 */
export function rayBoundaryIntersection(
  center: Point,
  boundary: Point[],
  compassDeg: number
): Point | null {
  const dir = compassDir(compassDeg);
  let minT = Infinity;

  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i];
    const b = boundary[(i + 1) % boundary.length];
    const t = raySegmentIntersect(center, dir, a, b);
    if (t !== null && t < minT) {
      minT = t;
    }
  }

  if (!isFinite(minT)) return null;
  return {
    x: center.x + dir.x * minT,
    y: center.y + dir.y * minT,
  };
}

/**
 * For a given compass angle, return a point at fractional distance `frac`
 * (0 = center, 1 = boundary edge) along the center→boundary ray.
 */
export function pointAtFraction(
  center: Point,
  boundary: Point[],
  compassDeg: number,
  frac: number
): Point {
  const hit = rayBoundaryIntersection(center, boundary, compassDeg);
  if (!hit) return center;
  return {
    x: center.x + (hit.x - center.x) * frac,
    y: center.y + (hit.y - center.y) * frac,
  };
}

/**
 * Build the polygon (in normalised coords) for a single DevtaZone.
 *
 * The polygon is an annular sector: inner arc + outer arc reversed.
 * We sample at `ANGULAR_STEPS` intermediate angles for smooth curves.
 */
const ANGULAR_STEPS = 6;

export function devtaZonePolygon(
  zone: DevtaZone,
  center: Point,
  boundary: Point[]
): Point[] {
  const [innerFrac, outerFrac] = RING_RADII[zone.ring] ?? [0, 1];

  const { startAngle } = zone;
  let endAngle = zone.endAngle;

  if (zone.ring === 0) {
    return buildCircleApprox(center, boundary, innerFrac, outerFrac);
  }

  if (endAngle < startAngle) endAngle += 360;

  const span = endAngle - startAngle;
  const steps = Math.max(2, Math.ceil((span / 22.5) * ANGULAR_STEPS));

  const innerPts: Point[] = [];
  const outerPts: Point[] = [];

  for (let s = 0; s <= steps; s++) {
    const angle = (startAngle + (span * s) / steps) % 360;
    innerPts.push(pointAtFraction(center, boundary, angle, innerFrac));
    outerPts.push(pointAtFraction(center, boundary, angle, outerFrac));
  }

  return [...innerPts, ...outerPts.reverse()];
}

function buildCircleApprox(
  center: Point,
  boundary: Point[],
  _innerFrac: number,
  outerFrac: number
): Point[] {
  const pts: Point[] = [];
  for (let deg = 0; deg < 360; deg += 10) {
    pts.push(pointAtFraction(center, boundary, deg, outerFrac));
  }
  return pts;
}

/**
 * Centroid of a polygon — used for placing the devta number label.
 */
export function polygonCentroid(pts: Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of pts) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / pts.length, y: sy / pts.length };
}
