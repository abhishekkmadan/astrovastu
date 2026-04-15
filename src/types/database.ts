export type ProjectType = "residential" | "commercial" | "industrial" | "temple" | "other";
export type ProjectStatus = "in_progress" | "completed" | "archived";
export type MarkerKind = "activity" | "utility" | "object";
export type Verdict = "good" | "bad" | "neutral";

export interface Point {
  x: number;
  y: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string;
  payment_customer_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  location: string;
  language: string;
  project_type: ProjectType;
  status: ProjectStatus;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Layout {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  image_path: string;
  image_url?: string;
  boundary: Point[];
  center: Point;
  north_degrees: number;
  viewport: { x: number; y: number; scale: number } | null;
  created_at: string;
  updated_at: string;
}

export interface LayoutMarker {
  id: string;
  layout_id: string;
  user_id: string;
  kind: MarkerKind;
  label: string;
  position: Point;
  verdict: Verdict;
  remedy: string;
  notes: string;
  created_at: string;
}

export const MARKER_TAXONOMY: Record<MarkerKind, string[]> = {
  activity: [
    "Sleeping",
    "Cooking",
    "Studying",
    "Meditation",
    "Dining",
    "Working",
    "Exercise",
    "Puja/Prayer",
    "Entertainment",
    "Storage",
  ],
  utility: [
    "Main Door",
    "Staircase",
    "Toilet",
    "Bathroom",
    "Septic Tank",
    "Water Tank",
    "Bore Well",
    "Electrical Panel",
    "Gas Pipeline",
    "Drainage",
  ],
  object: [
    "Bed",
    "Sofa",
    "Dining Table",
    "Refrigerator",
    "Washing Machine",
    "TV",
    "Mirror",
    "Safe/Locker",
    "Gas Stove",
    "Water Purifier",
    "AC Unit",
    "Temple/Mandir",
    "Shoe Rack",
    "Dustbin",
    "Plant",
    "Aquarium",
    "Clock",
    "Painting",
  ],
};

export const VASTU_TOOLS = [
  { key: "vastu-chakra", label: "Vastu Chakra", enabled: true },
  { key: "measurement", label: "Measurement", enabled: false },
  { key: "devta-marking", label: "Devta Marking", enabled: false },
  { key: "marma-marking", label: "Marma Marking", enabled: false },
  { key: "body-part-marking", label: "Body Part Marking", enabled: false },
  { key: "prakriti-marking", label: "Prakriti Marking", enabled: false },
  { key: "tri-dosha-marking", label: "Tri Dosha Marking", enabled: false },
  { key: "tri-guna-marking", label: "Tri Guna Marking", enabled: false },
  { key: "mark-objects", label: "Mark Objects", enabled: true },
  { key: "devta-activation", label: "Devta Activation", enabled: false },
] as const;
