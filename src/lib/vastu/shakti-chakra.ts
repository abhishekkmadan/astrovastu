/**
 * Shakti Chakra geometry used on the floor plan (North = screen-up when North tilt = 0°).
 *
 * - 360° is split into 16 zones of 22.5° each (solah directions).
 * - The outer ring is split into 32 entrances of 11.25° each (8 per cardinal block).
 *
 * Entrance coding (clockwise, starting at the western edge of the North quadrant):
 *   indices 0–7   → N1…N8
 *   indices 8–15  → E1…E8
 *   indices 16–23 → S1…S8
 *   indices 24–31 → W1…W8
 *
 * If your lineage uses different names or ordering, edit:
 *   - ZONE_16_SUBLABELS — optional second line per zone (pada notes, deities, etc.)
 *   - ENTRANCE_CUSTOM_LABELS — if non-empty length 32, overrides N1/E1… numbering
 */

/** Compass labels for the 16 directional zones (center of each 22.5° band). */
export const ZONE_16_COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const;

/** Same 16 zones as diagram labels (cardinals spelled out; matches printed Vastu chakra). */
export const ZONE_16_DIAGRAM_LABELS = [
  "NORTH",
  "NNE",
  "NE",
  "ENE",
  "EAST",
  "ESE",
  "SE",
  "SSE",
  "SOUTH",
  "SSW",
  "SW",
  "WSW",
  "WEST",
  "WNW",
  "NW",
  "NNW",
] as const;

/**
 * Optional second line shown inside each zone (e.g. pada / deity notes).
 * Leave empty string to hide for that zone.
 */
export const ZONE_16_SUBLABELS: string[] = [
  "", "", "", "", "", "", "", "",
  "", "", "", "", "", "", "", "",
];

/** If length is 32, used instead of default N1–N8 / E1–E8 / … */
export const ENTRANCE_CUSTOM_LABELS: string[] | null = null;

export function getDefaultEntranceLabel(index: number): string {
  if (index < 0 || index > 31) return "?";
  if (ENTRANCE_CUSTOM_LABELS && ENTRANCE_CUSTOM_LABELS.length === 32) {
    return ENTRANCE_CUSTOM_LABELS[index] ?? `?${index}`;
  }
  const block = ["N", "E", "S", "W"][Math.floor(index / 8)] ?? "X";
  const n = (index % 8) + 1;
  return `${block}${n}`;
}

/** Mid-angle (degrees) of entrance slot `index` in Konva math: 0° = east, +90° = south, -90° = north */
export function entranceMidAngleDeg(index: number): number {
  return index * 11.25 + 5.625 - 90;
}

/** Mid-angle (degrees) of 16-zone `zoneIndex` (0 = North ray). Same as spoke centers. */
export function zone16MidAngleDeg(zoneIndex: number): number {
  return zoneIndex * 22.5 - 90;
}
