/**
 * Mock Vastu verdict database.
 *
 * Maps (item key from OBJECT_CATALOG) + (16-zone index 0–15, matching
 * ZONE_16_COMPASS in shakti-chakra.ts) → { verdict, explanation }.
 *
 * Zone indices:
 *   0  N    1  NNE  2  NE   3  ENE
 *   4  E    5  ESE  6  SE   7  SSE
 *   8  S    9  SSW  10 SW   11 WSW
 *   12 W    13 WNW  14 NW   15 NNW
 *
 * NOTE: These are starter rules to make the UX feel real; extend freely.
 */

import { ZONE_16_COMPASS } from "./shakti-chakra";

export type Verdict = "good" | "bad" | "neutral";

export interface ZoneVerdict {
  verdict: Verdict;
  explanation: string;
}

type VerdictMap = Record<number, ZoneVerdict>;

export const ZONE_VERDICTS: Record<string, VerdictMap> = {
  // ============ Activities ============
  sleeping: {
    10: { verdict: "good", explanation: "South-West (Nairutya) is the ideal direction for sleeping — it offers stability and deep rest." },
    14: { verdict: "good", explanation: "North-West supports restful sleep for guests and children." },
    2: { verdict: "bad", explanation: "North-East (Ishan) is a sacred / water zone — sleeping here causes mental unrest." },
    0: { verdict: "bad", explanation: "Direct North is a water zone and disturbs sleep quality." },
    4: { verdict: "neutral", explanation: "East is acceptable but best used for study or work rather than sleep." },
  },

  cooking: {
    6: { verdict: "good", explanation: "South-East (Agneya) is the fire zone — perfect for cooking." },
    10: { verdict: "bad", explanation: "South-West is earth zone; cooking here creates fire-earth conflict." },
    2: { verdict: "bad", explanation: "North-East is water zone — fire here clashes with water element." },
    14: { verdict: "bad", explanation: "North-West is air zone — fire here leads to instability in household." },
  },

  studying: {
    0: { verdict: "good", explanation: "Facing North while studying attracts wealth and knowledge." },
    2: { verdict: "good", explanation: "North-East is the zone of wisdom — ideal for study and learning." },
    4: { verdict: "good", explanation: "East is energised by the rising sun — excellent for concentration." },
    8: { verdict: "bad", explanation: "Facing South while studying is discouraged; drains mental energy." },
  },

  meditation: {
    2: { verdict: "good", explanation: "North-East (Ishan) is the most spiritual zone — ideal for meditation and puja." },
    0: { verdict: "good", explanation: "Facing North brings calm and higher focus during meditation." },
    4: { verdict: "good", explanation: "Facing East aligns with solar energy — supports daily sadhana." },
    10: { verdict: "neutral", explanation: "South-West is grounding but heavy; acceptable for meditation but not optimal." },
  },

  dining: {
    12: { verdict: "good", explanation: "West is the recommended direction for the dining area." },
    4: { verdict: "good", explanation: "East is considered healthy for dining; face East while eating." },
    2: { verdict: "bad", explanation: "Avoid dining in the North-East (sacred zone)." },
  },

  working: {
    0: { verdict: "good", explanation: "Facing North while working attracts career growth." },
    4: { verdict: "good", explanation: "Facing East energises you for productive work." },
    8: { verdict: "bad", explanation: "Facing South at work is discouraged; causes stagnation." },
  },

  exercise: {
    0: { verdict: "good", explanation: "North-West / North area is good for an exercise / gym space." },
    14: { verdict: "good", explanation: "North-West supports movement and physical activity." },
    2: { verdict: "bad", explanation: "Avoid placing a gym in the North-East — it disturbs the subtle zone." },
  },

  puja: {
    2: { verdict: "good", explanation: "North-East (Ishan) is the most auspicious corner for a puja space." },
    0: { verdict: "good", explanation: "North is acceptable for a prayer area, facing East." },
    6: { verdict: "bad", explanation: "Avoid puja in South-East; fire zone conflicts with devotional water rituals." },
    10: { verdict: "bad", explanation: "South-West is too heavy for a sacred zone." },
  },

  entertainment: {
    12: { verdict: "good", explanation: "West is well-suited for entertainment / living rooms." },
    0: { verdict: "neutral", explanation: "North is acceptable for a TV or lounge." },
    2: { verdict: "bad", explanation: "Avoid noisy entertainment in the sacred North-East." },
  },

  storage: {
    10: { verdict: "good", explanation: "South-West is the ideal storage / heavy-items zone." },
    11: { verdict: "good", explanation: "WSW also supports heavy storage." },
    2: { verdict: "bad", explanation: "Storing heavy items in North-East blocks spiritual flow." },
  },

  // ============ Utilities ============
  "main-door": {
    0: { verdict: "good", explanation: "North entrance brings wealth and opportunity (Kuber direction)." },
    2: { verdict: "good", explanation: "North-East entrance invites positive energy and prosperity." },
    4: { verdict: "good", explanation: "East entrance is auspicious — blessed by rising sun." },
    10: { verdict: "bad", explanation: "South-West entrance is inauspicious — causes financial and health issues." },
    8: { verdict: "bad", explanation: "Direct South entrance is discouraged unless balanced with remedies." },
    6: { verdict: "neutral", explanation: "South-East is acceptable with proper Vastu correction." },
  },

  staircase: {
    10: { verdict: "good", explanation: "South-West is a strong zone for a staircase — supports structure." },
    6: { verdict: "good", explanation: "South / South-East is also acceptable for stairs." },
    2: { verdict: "bad", explanation: "Never place a staircase in the North-East — blocks spiritual energy." },
    0: { verdict: "bad", explanation: "Staircase in direct North disturbs wealth flow." },
  },

  toilet: {
    14: { verdict: "good", explanation: "North-West is a suitable zone for toilets (waste disposal)." },
    12: { verdict: "good", explanation: "West is acceptable for toilets." },
    10: { verdict: "bad", explanation: "Avoid toilets in the South-West — weakens the master of the house." },
    2: { verdict: "bad", explanation: "Toilet in North-East is very inauspicious — blocks sacred energy." },
    6: { verdict: "bad", explanation: "Avoid toilet in South-East (fire zone) — causes health issues." },
  },

  bathroom: {
    4: { verdict: "good", explanation: "East is the ideal bathroom zone — aligns with water element and sunrise." },
    14: { verdict: "good", explanation: "North-West is suitable for a bathroom." },
    2: { verdict: "bad", explanation: "Avoid bathrooms in North-East (sacred water is for puja, not bathing)." },
  },

  "septic-tank": {
    14: { verdict: "good", explanation: "North-West is the traditional placement for a septic tank." },
    10: { verdict: "bad", explanation: "Never place a septic tank in the South-West — weakens the owner." },
    2: { verdict: "bad", explanation: "North-East is sacred — never place a septic tank here." },
  },

  "water-tank": {
    2: { verdict: "good", explanation: "North-East (Ishan) is the ideal zone for an underground water tank." },
    0: { verdict: "good", explanation: "North is acceptable for a water source." },
    6: { verdict: "bad", explanation: "South-East (fire zone) is wrong for water storage — creates conflict." },
    10: { verdict: "bad", explanation: "Underground water in South-West weakens the foundation." },
  },

  "bore-well": {
    2: { verdict: "good", explanation: "North-East is the best location for a bore-well." },
    0: { verdict: "good", explanation: "North is a good alternative for a bore-well." },
    10: { verdict: "bad", explanation: "Bore-well in South-West causes financial instability." },
  },

  "electrical-panel": {
    6: { verdict: "good", explanation: "South-East (fire zone) is ideal for electrical panels and meters." },
    2: { verdict: "bad", explanation: "Avoid electrical panels in the North-East." },
  },

  "gas-pipeline": {
    6: { verdict: "good", explanation: "South-East (Agneya) is the correct fire-element zone for gas supply." },
    2: { verdict: "bad", explanation: "Gas piping through North-East is strongly discouraged." },
  },

  drainage: {
    0: { verdict: "good", explanation: "Drainage flowing towards North is auspicious." },
    4: { verdict: "good", explanation: "Drainage flowing towards East is also auspicious." },
    10: { verdict: "bad", explanation: "Drainage towards South-West causes wealth loss." },
  },

  // ============ Objects ============
  bed: {
    10: { verdict: "good", explanation: "Bed in the South-West brings stability, good sleep, and longevity." },
    14: { verdict: "good", explanation: "North-West bedroom suits guests and unmarried children." },
    2: { verdict: "bad", explanation: "Avoid sleeping in North-East — disturbs mind, poor sleep quality." },
    6: { verdict: "bad", explanation: "Avoid South-East for master bedroom — fire disturbs relationships." },
    0: { verdict: "neutral", explanation: "North is acceptable; ensure head faces South or East while sleeping." },
  },

  sofa: {
    10: { verdict: "good", explanation: "Place the main sofa in the South-West — offers grounded seating for the household head." },
    12: { verdict: "good", explanation: "West is also suitable for the primary sofa." },
    2: { verdict: "bad", explanation: "Avoid heavy sofas in North-East; block light and flow." },
  },

  "dining-table": {
    12: { verdict: "good", explanation: "West-facing dining table is auspicious." },
    4: { verdict: "good", explanation: "Dining facing East is healthy and recommended." },
    10: { verdict: "bad", explanation: "Avoid placing dining table in South-West corner." },
  },

  refrigerator: {
    12: { verdict: "good", explanation: "West or North-West is ideal for the refrigerator." },
    14: { verdict: "good", explanation: "North-West is a practical placement for the fridge." },
    2: { verdict: "bad", explanation: "Avoid fridge in North-East; blocks Ishan corner." },
  },

  "washing-machine": {
    6: { verdict: "good", explanation: "South-East or North-West is good for a washing machine." },
    14: { verdict: "good", explanation: "North-West is also acceptable." },
    2: { verdict: "bad", explanation: "Avoid washing machine in North-East." },
  },

  tv: {
    6: { verdict: "good", explanation: "Place the TV in the South-East of the living room." },
    12: { verdict: "neutral", explanation: "West wall TV is acceptable." },
    2: { verdict: "bad", explanation: "Avoid TV in North-East — creates restlessness in the sacred zone." },
  },

  mirror: {
    0: { verdict: "good", explanation: "North wall mirror doubles wealth energy." },
    4: { verdict: "good", explanation: "East wall mirror is auspicious." },
    8: { verdict: "bad", explanation: "Never place a mirror on the South wall — reflects heat and negative energy." },
    10: { verdict: "bad", explanation: "Avoid mirrors on the South-West wall." },
  },

  "safe-locker": {
    10: { verdict: "good", explanation: "Place the safe in the South-West room, opening to the North — Kuber's direction." },
    0: { verdict: "good", explanation: "A safe opening to the North attracts wealth." },
    6: { verdict: "bad", explanation: "Avoid placing the safe in South-East (fire zone)." },
  },

  "gas-stove": {
    6: { verdict: "good", explanation: "Gas stove in the South-East with the cook facing East is the classical placement." },
    2: { verdict: "bad", explanation: "Never place the gas stove in North-East — fire and water clash." },
    10: { verdict: "bad", explanation: "Stove in South-West destabilises the household." },
  },

  "water-purifier": {
    2: { verdict: "good", explanation: "North-East is the best place for drinking water / purifier." },
    0: { verdict: "good", explanation: "North is also acceptable for a water purifier." },
    6: { verdict: "bad", explanation: "Keep water purifier away from fire (South-East)." },
  },

  "ac-unit": {
    12: { verdict: "good", explanation: "West / North-West is suitable for an AC unit." },
    14: { verdict: "good", explanation: "North-West is acceptable for cooling equipment." },
    2: { verdict: "bad", explanation: "Avoid heavy AC units in the North-East." },
  },

  mandir: {
    2: { verdict: "good", explanation: "North-East (Ishan) is the most sacred zone — ideal for a Mandir." },
    0: { verdict: "good", explanation: "North wall Mandir is acceptable; face East while praying." },
    4: { verdict: "good", explanation: "East wall Mandir is good; aligns with rising sun." },
    10: { verdict: "bad", explanation: "Never place Mandir in South-West or below a staircase." },
    6: { verdict: "bad", explanation: "Avoid Mandir in South-East (fire zone)." },
  },

  "shoe-rack": {
    14: { verdict: "good", explanation: "Shoe rack in North-West near the entrance is acceptable." },
    15: { verdict: "neutral", explanation: "NNW is acceptable for shoes." },
    2: { verdict: "bad", explanation: "Never keep shoes in North-East — pollutes the sacred zone." },
  },

  dustbin: {
    10: { verdict: "good", explanation: "Dustbins can be kept in South-West (disposal zone), emptied daily." },
    14: { verdict: "good", explanation: "North-West also works for daily trash." },
    2: { verdict: "bad", explanation: "Never place a dustbin in the North-East — blocks positive flow." },
  },

  plant: {
    2: { verdict: "good", explanation: "Small plants in the North-East enhance positivity." },
    0: { verdict: "good", explanation: "Plants in the North area bring growth and abundance." },
    4: { verdict: "good", explanation: "East-facing plants energise the home with sunlight." },
    10: { verdict: "neutral", explanation: "Avoid thorny plants in South-West; other plants are neutral." },
  },

  aquarium: {
    0: { verdict: "good", explanation: "Aquarium in the North brings wealth (Kuber's water element)." },
    2: { verdict: "good", explanation: "North-East aquarium enhances prosperity." },
    4: { verdict: "good", explanation: "East is also auspicious for an aquarium." },
    6: { verdict: "bad", explanation: "Avoid aquarium in South-East — water clashes with fire zone." },
    8: { verdict: "bad", explanation: "Avoid aquarium in the South." },
  },

  clock: {
    0: { verdict: "good", explanation: "Wall clock on the North wall supports timely opportunities." },
    4: { verdict: "good", explanation: "East wall clock is auspicious." },
    8: { verdict: "bad", explanation: "Avoid clocks on the South wall." },
  },

  painting: {
    0: { verdict: "good", explanation: "North wall — paintings of water, flowing rivers, mountains attract wealth." },
    4: { verdict: "good", explanation: "East wall is great for rising-sun and nature paintings." },
    8: { verdict: "bad", explanation: "Avoid violent, sad, or war-themed paintings — especially on the South wall." },
  },
};

/** Return a zone-compass label like `N`, `SE`, `WSW`. */
export function zoneLabel(zoneIdx: number): string {
  return ZONE_16_COMPASS[zoneIdx] ?? "?";
}

/**
 * Look up a verdict for `(itemKey, zoneIdx)`. Falls back to a neutral rule if
 * nothing is defined in ZONE_VERDICTS.
 */
export function lookupVerdict(
  itemKey: string,
  itemLabel: string,
  zoneIdx: number
): ZoneVerdict {
  const hit = ZONE_VERDICTS[itemKey]?.[zoneIdx];
  if (hit) return hit;
  return {
    verdict: "neutral",
    explanation: `No specific Vastu rule recorded for ${itemLabel} in the ${zoneLabel(
      zoneIdx
    )} zone. Treat as neutral unless local tradition says otherwise.`,
  };
}
