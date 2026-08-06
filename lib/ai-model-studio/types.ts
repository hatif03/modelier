export type ApparelCategory = "upper_body" | "lower_body" | "full_body" | "auto";

export type JewelryCategory = "ring" | "necklace" | "earring" | "bracelet" | "watch";

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

export type AIStudioFlow = "apparel_vto" | "makeup_vto" | "jewelry_vto" | "image_to_video";

export type VariantStatus = "processing" | "success" | "error";

export type GenerationVariantView = {
  id: string;
  referenceModelLabel: string;
  status: VariantStatus;
  resultImageUrl?: string;
  // true when resultImageUrl actually holds a video URL (image_to_video flow)
  // — the field is reused rather than renamed repo-wide for one flow.
  isVideo?: boolean;
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
};
