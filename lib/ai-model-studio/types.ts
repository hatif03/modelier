export type ApparelCategory = "upper_body" | "lower_body" | "full_body" | "auto";

export type JewelryCategory = "ring" | "necklace" | "earring" | "bracelet" | "watch";

export type RingFinger = "thumb" | "index" | "middle" | "ring" | "pinky";

// The ring VTO API requires a finger, unlike every other jewelry category —
// it changes which finger the ring renders on, not just a lighting/shadow tweak.
export const RING_FINGERS: { id: RingFinger; label: string }[] = [
  { id: "thumb", label: "Thumb" },
  { id: "index", label: "Index" },
  { id: "middle", label: "Middle" },
  { id: "ring", label: "Ring finger" },
  { id: "pinky", label: "Pinky" },
];

export const APPAREL_CATEGORIES: { id: ApparelCategory; label: string }[] = [
  { id: "upper_body", label: "Top" },
  { id: "lower_body", label: "Bottom" },
  { id: "full_body", label: "Dress / Outfit" },
  { id: "auto", label: "Auto-detect" },
];

// Single source of truth for this taxonomy — consumed by both the AI Model
// Studio jewelry flow and Jewelry Studio's own "new design" category chips,
// which used to each hard-code their own near-identical copy of this list.
export const JEWELRY_CATEGORIES: { id: JewelryCategory; label: string }[] = [
  { id: "ring", label: "Ring" },
  { id: "necklace", label: "Necklace" },
  { id: "earring", label: "Earring" },
  { id: "bracelet", label: "Bracelet" },
  { id: "watch", label: "Watch" },
];

// "effect" covers every single-photo skin/face/body retouch or analysis flow
// (see lib/ai-model-studio/effects.ts for the registry of specific effects).
// "backdrop" generates a scene/background from a prompt (see
// lib/ai-model-studio/backdrops.ts) — no source photo required.
export type AIStudioFlow = "apparel_vto" | "makeup_vto" | "jewelry_vto" | "image_to_video" | "effect" | "backdrop";

export type VariantStatus = "processing" | "success" | "error";

export type GenerationVariantView = {
  id: string;
  referenceModelLabel: string;
  status: VariantStatus;
  resultImageUrl?: string;
  // true when resultImageUrl actually holds a video URL (image_to_video flow)
  // — the field is reused rather than renamed repo-wide for one flow.
  isVideo?: boolean;
  // True for data-output effects (skin analysis, face analyzer, ...) — the UI
  // renders a score card instead of an image/video, even while still
  // processing (analysisResult itself is only populated once it succeeds).
  isAnalysis?: boolean;
  analysisResult?: Record<string, unknown>;
  errorMessage?: string;
  colorHarmonyScore?: number;
  colorHarmonyNote?: string;
  isBestMatch?: boolean;
};

export type GenerationStatus = "processing" | "success" | "partial" | "error";

export type GenerationView = {
  id: string;
  status: GenerationStatus;
  errorMessage?: string;
  variants: GenerationVariantView[];
  // The dominant color already extracted from the apparel/jewelry source photo
  // for color-harmony scoring (see lib/colorHarmony.ts) — surfaced here too so
  // the UI can offer it as a one-click Brand Kit color ("Magic Palette").
  garmentColorHex?: string;
};
