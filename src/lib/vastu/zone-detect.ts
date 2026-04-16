/**
 * Map a point on the floor plan to one of the 16 Shakti Chakra zones.
 *
 * Zones are 22.5° sectors centred on the 16 compass labels (ZONE_16_COMPASS),
 * so zone 0 = North spans -11.25° to +11.25° etc.
 *
 * `northDegrees` is the chakra's rotation; subtract it so the result is zone
 * index relative to the (rotated) North arrow, matching what the user sees
 * in Vastu Chakra mode.
 */

import type { Point } from "@/types/database";

/**
 * Returns a zone index in [0, 15].
 *   0=N, 1=NNE, 2=NE, 3=ENE, 4=E, 5=ESE, 6=SE, 7=SSE,
 *   8=S, 9=SSW, 10=SW, 11=WSW, 12=W, 13=WNW, 14=NW, 15=NNW.
 */
export function zoneIndexForPoint(
  marker: Point,
  center: Point,
  northDegrees: number
): number {
  const dx = marker.x - center.x;
  // screen y grows downward; negate so "up on screen" = +y in math
  const dy = -(marker.y - center.y);

  if (dx === 0 && dy === 0) return 0;

  // atan2 returns [-pi, pi] where 0 = East, +pi/2 = North.
  // Convert to compass: 0° = North, clockwise.
  const compass = (90 - (Math.atan2(dy, dx) * 180) / Math.PI + 720) % 360;

  // Rotate into chakra frame (cancel the chakra's northDegrees tilt).
  const rel = ((compass - northDegrees) % 360 + 360) % 360;

  // Shift so zone 0 (N) is centred at 0°.
  return Math.floor(((rel + 11.25) % 360) / 22.5);
}
