/**
 * Flat catalog of all activities, utilities, and objects for the Mark Objects tool.
 *
 * Keeps the original `kind` so it can be stored on `layout_markers.kind`.
 * The `key` is a stable slug used as the key into ZONE_VERDICTS.
 */

import type { MarkerKind } from "@/types/database";

export interface CatalogItem {
  /** Stable slug (used as key in the verdict DB). */
  key: string;
  /** Human-facing label for the dropdown. */
  label: string;
  /** Persisted onto layout_markers.kind for back-compat. */
  kind: MarkerKind;
}

export const OBJECT_CATALOG: CatalogItem[] = [
  // --- Activities ---
  { key: "sleeping", label: "Sleeping", kind: "activity" },
  { key: "cooking", label: "Cooking", kind: "activity" },
  { key: "studying", label: "Studying", kind: "activity" },
  { key: "meditation", label: "Meditation", kind: "activity" },
  { key: "dining", label: "Dining", kind: "activity" },
  { key: "working", label: "Working", kind: "activity" },
  { key: "exercise", label: "Exercise", kind: "activity" },
  { key: "puja", label: "Puja / Prayer", kind: "activity" },
  { key: "entertainment", label: "Entertainment", kind: "activity" },
  { key: "storage", label: "Storage", kind: "activity" },

  // --- Utilities ---
  { key: "main-door", label: "Main Door", kind: "utility" },
  { key: "staircase", label: "Staircase", kind: "utility" },
  { key: "toilet", label: "Toilet", kind: "utility" },
  { key: "bathroom", label: "Bathroom", kind: "utility" },
  { key: "septic-tank", label: "Septic Tank", kind: "utility" },
  { key: "water-tank", label: "Water Tank", kind: "utility" },
  { key: "bore-well", label: "Bore Well", kind: "utility" },
  { key: "electrical-panel", label: "Electrical Panel", kind: "utility" },
  { key: "gas-pipeline", label: "Gas Pipeline", kind: "utility" },
  { key: "drainage", label: "Drainage", kind: "utility" },

  // --- Objects ---
  { key: "bed", label: "Bed", kind: "object" },
  { key: "sofa", label: "Sofa", kind: "object" },
  { key: "dining-table", label: "Dining Table", kind: "object" },
  { key: "refrigerator", label: "Refrigerator", kind: "object" },
  { key: "washing-machine", label: "Washing Machine", kind: "object" },
  { key: "tv", label: "TV", kind: "object" },
  { key: "mirror", label: "Mirror", kind: "object" },
  { key: "safe-locker", label: "Safe / Locker", kind: "object" },
  { key: "gas-stove", label: "Gas Stove", kind: "object" },
  { key: "water-purifier", label: "Water Purifier", kind: "object" },
  { key: "ac-unit", label: "AC Unit", kind: "object" },
  { key: "mandir", label: "Temple / Mandir", kind: "object" },
  { key: "shoe-rack", label: "Shoe Rack", kind: "object" },
  { key: "dustbin", label: "Dustbin", kind: "object" },
  { key: "plant", label: "Plant", kind: "object" },
  { key: "aquarium", label: "Aquarium", kind: "object" },
  { key: "clock", label: "Clock", kind: "object" },
  { key: "painting", label: "Painting", kind: "object" },
];

export function findCatalogItem(key: string): CatalogItem | undefined {
  return OBJECT_CATALOG.find((i) => i.key === key);
}
