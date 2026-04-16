/**
 * 45-Devta Vastu Purusha Mandala data.
 *
 * Geometry:
 *   - 4 concentric rings (0 = center/Brahmasthan, 1 = inner, 2 = middle, 3 = outer)
 *   - Each devta occupies an angular span [startAngle, endAngle] in degrees
 *   - 0° = North, angles increase clockwise (like a compass)
 *   - Ring 0 (Brahma) spans the full 360°
 *
 * Ring radii (fraction of distance from center to boundary):
 *   Ring 0: 0.00 – 0.15 (Brahmasthan)
 *   Ring 1: 0.15 – 0.40 (inner)
 *   Ring 2: 0.40 – 0.70 (middle)
 *   Ring 3: 0.70 – 1.00 (outer / boundary)
 *
 * Data extracted from the Shakti Chakra reference image.
 * Edit names/titles here if your lineage uses different terminology.
 */

export interface DevtaZone {
  /** 1-based number shown on the map */
  number: number;
  /** Sanskrit / traditional deity name */
  deity: string;
  /** English functional title */
  title: string;
  /** Short code from the Shakti Chakra (e.g. "R11", "V4") */
  code: string;
  /** Concentric ring: 0 = center, 1 = inner, 2 = middle, 3 = outer */
  ring: number;
  /** Start angle in degrees (0 = North, clockwise) */
  startAngle: number;
  /** End angle in degrees */
  endAngle: number;
  /** Background colour hint (CSS) — from the Shakti Chakra colour bands */
  color: string;
}

/** Fractional radii for each ring [innerFraction, outerFraction] */
export const RING_RADII: [number, number][] = [
  [0.0, 0.15],   // Ring 0 — Brahmasthan
  [0.15, 0.40],  // Ring 1 — inner
  [0.40, 0.70],  // Ring 2 — middle
  [0.70, 1.00],  // Ring 3 — outer
];

/**
 * The 45 Devta zones.
 *
 * Angular layout (outer ring = Ring 3, 16 zones of 22.5° each):
 *   N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW
 *
 * Middle ring (Ring 2) has 12 zones of 30° each.
 * Inner ring (Ring 1) has 8 zones of 45° each.
 * Center (Ring 0) is 1 zone covering all 360°.
 *
 * Total: 1 + 8 + 12 + 16 + 8 = 45
 * (The 8 extra are corner devtas that sit at intercardinal positions spanning Ring 2-3.)
 */

export const DEVTA_ZONES: DevtaZone[] = [
  // ─── Ring 0: Brahmasthan (center) ───
  { number: 1, deity: "Brahma", title: "Goal / Creator", code: "B1", ring: 0, startAngle: 0, endAngle: 360, color: "#f9e79f" },

  // ─── Ring 1: Inner 8 zones (45° each, starting from North) ───
  { number: 2, deity: "Bhudhar", title: "System Architecture", code: "V2", ring: 1, startAngle: 337.5, endAngle: 22.5, color: "#aed6f1" },
  { number: 3, deity: "Aaraha", title: "Nutrients", code: "V3", ring: 1, startAngle: 22.5, endAngle: 67.5, color: "#aed6f1" },
  { number: 4, deity: "Vitath", title: "Vitamin", code: "V5", ring: 1, startAngle: 67.5, endAngle: 112.5, color: "#aed6f1" },
  { number: 5, deity: "Aaryama", title: "Liasoner", code: "A7", ring: 1, startAngle: 112.5, endAngle: 157.5, color: "#aed6f1" },
  { number: 6, deity: "Savitra", title: "Distributor", code: "A11", ring: 1, startAngle: 157.5, endAngle: 202.5, color: "#aed6f1" },
  { number: 7, deity: "Vivaswan", title: "King", code: "A1", ring: 1, startAngle: 202.5, endAngle: 247.5, color: "#aed6f1" },
  { number: 8, deity: "Mitra", title: "HR", code: "A4", ring: 1, startAngle: 247.5, endAngle: 292.5, color: "#aed6f1" },
  { number: 9, deity: "Rudra", title: "Controller", code: "R1", ring: 1, startAngle: 292.5, endAngle: 337.5, color: "#aed6f1" },

  // ─── Ring 2: Middle 12 zones (30° each, starting from North) ───
  { number: 10, deity: "Bhalat", title: "Merchandiser", code: "V4", ring: 2, startAngle: 345, endAngle: 15, color: "#f9e79f" },
  { number: 11, deity: "Soma", title: "Solution", code: "R11", ring: 2, startAngle: 15, endAngle: 45, color: "#f5cba7" },
  { number: 12, deity: "Bhujag", title: "Doctor", code: "R11", ring: 2, startAngle: 45, endAngle: 75, color: "#f5cba7" },
  { number: 13, deity: "Shikhi", title: "Visionary", code: "R3", ring: 2, startAngle: 75, endAngle: 105, color: "#abebc6" },
  { number: 14, deity: "Surya", title: "Regulator", code: "V6", ring: 2, startAngle: 105, endAngle: 135, color: "#abebc6" },
  { number: 15, deity: "Satya", title: "Judge", code: "R5", ring: 2, startAngle: 135, endAngle: 165, color: "#f5b7b1" },
  { number: 16, deity: "Pusha", title: "Binder", code: "A8", ring: 2, startAngle: 165, endAngle: 195, color: "#f5b7b1" },
  { number: 17, deity: "Yama", title: "Discipliner", code: "A3", ring: 2, startAngle: 195, endAngle: 225, color: "#f9e79f" },
  { number: 18, deity: "Gandharva", title: "Artist", code: "R6", ring: 2, startAngle: 225, endAngle: 255, color: "#f9e79f" },
  { number: 19, deity: "Varun", title: "Chief Operator", code: "A5", ring: 2, startAngle: 255, endAngle: 285, color: "#d5f5e3" },
  { number: 20, deity: "Asur", title: "Under Cover", code: "a1", ring: 2, startAngle: 285, endAngle: 315, color: "#d5f5e3" },
  { number: 21, deity: "Roga", title: "Weakner", code: "B5", ring: 2, startAngle: 315, endAngle: 345, color: "#f5cba7" },

  // ─── Ring 3: Outer 16 zones (22.5° each, starting from North) ───
  { number: 22, deity: "Mukhya", title: "Designer", code: "a6", ring: 3, startAngle: 326.25, endAngle: 348.75, color: "#f9e79f" },
  { number: 23, deity: "Aap", title: "Attacker", code: "a5", ring: 3, startAngle: 348.75, endAngle: 11.25, color: "#f9e79f" },
  { number: 24, deity: "Bhalat", title: "Merchandiser", code: "V4", ring: 3, startAngle: 11.25, endAngle: 33.75, color: "#f5cba7" },
  { number: 25, deity: "Soma", title: "Solution", code: "R11", ring: 3, startAngle: 33.75, endAngle: 56.25, color: "#f5cba7" },
  { number: 26, deity: "Aditi", title: "Care Taker", code: "M1", ring: 3, startAngle: 56.25, endAngle: 78.75, color: "#abebc6" },
  { number: 27, deity: "Diti", title: "Restrainer", code: "M2", ring: 3, startAngle: 78.75, endAngle: 101.25, color: "#abebc6" },
  { number: 28, deity: "Parjanya", title: "Fertilizer", code: "A8", ring: 3, startAngle: 101.25, endAngle: 123.75, color: "#abebc6" },
  { number: 29, deity: "Jayant", title: "Go Getter", code: "R4", ring: 3, startAngle: 123.75, endAngle: 146.25, color: "#f5b7b1" },
  { number: 30, deity: "Mahendra", title: "Manager", code: "A9", ring: 3, startAngle: 146.25, endAngle: 168.75, color: "#f5b7b1" },
  { number: 31, deity: "Bhrisha", title: "Grinder", code: "a1", ring: 3, startAngle: 168.75, endAngle: 191.25, color: "#f5b7b1" },
  { number: 32, deity: "Antariksh", title: "Expander", code: "V7", ring: 3, startAngle: 191.25, endAngle: 213.75, color: "#f9e79f" },
  { number: 33, deity: "Anil", title: "Uplifter", code: "V8", ring: 3, startAngle: 213.75, endAngle: 236.25, color: "#f9e79f" },
  { number: 34, deity: "Mrigassi", title: "Hunter", code: "a11", ring: 3, startAngle: 236.25, endAngle: 258.75, color: "#d5f5e3" },
  { number: 35, deity: "Pitri", title: "Ancestors", code: "V1", ring: 3, startAngle: 258.75, endAngle: 281.25, color: "#d5f5e3" },
  { number: 36, deity: "Dauwarik", title: "Guardian", code: "R8", ring: 3, startAngle: 281.25, endAngle: 303.75, color: "#d5f5e3" },
  { number: 37, deity: "Sugreev", title: "Grasper", code: "R9", ring: 3, startAngle: 303.75, endAngle: 326.25, color: "#f5cba7" },

  // ─── Corner devtas (at intercardinals, spanning Ring 2–3) ───
  { number: 38, deity: "Pushpdant", title: "Guru", code: "R10", ring: 3, startAngle: 258.75, endAngle: 281.25, color: "#d5dbef" },
  { number: 39, deity: "Bhringraj", title: "Cleaner", code: "a10", ring: 3, startAngle: 213.75, endAngle: 236.25, color: "#d5dbef" },
  { number: 40, deity: "Shosha", title: "Drier", code: "a3", ring: 3, startAngle: 281.25, endAngle: 303.75, color: "#d5dbef" },
  { number: 41, deity: "Papyakshma", title: "Addiction", code: "a4", ring: 3, startAngle: 303.75, endAngle: 326.25, color: "#d5dbef" },
  { number: 42, deity: "Grihakshata", title: "Cruncher", code: "a8", ring: 3, startAngle: 168.75, endAngle: 191.25, color: "#d5dbef" },
  { number: 43, deity: "Anil-Nav", title: "Navigator", code: "A12", ring: 3, startAngle: 146.25, endAngle: 168.75, color: "#d5dbef" },
  { number: 44, deity: "Savitri", title: "Executor", code: "A2", ring: 3, startAngle: 236.25, endAngle: 258.75, color: "#d5dbef" },
  { number: 45, deity: "Indra", title: "Chief", code: "K1", ring: 3, startAngle: 56.25, endAngle: 78.75, color: "#d5dbef" },
];

/** Look up a devta by its 1-based number */
export function getDevta(number: number): DevtaZone | undefined {
  return DEVTA_ZONES.find((d) => d.number === number);
}

/** All devtas for a given ring */
export function devtasInRing(ring: number): DevtaZone[] {
  return DEVTA_ZONES.filter((d) => d.ring === ring);
}
