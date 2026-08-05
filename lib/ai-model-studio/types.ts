export type ApparelCategory = "upper_body" | "lower_body" | "full_body" | "auto";

export type AIStudioFlow = "apparel_vto" | "makeup_vto";

export type VariantStatus = "processing" | "success" | "error";

export type GenerationVariantView = {
  id: string;
  referenceModelLabel: string;
  status: VariantStatus;
  resultImageUrl?: string;
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
