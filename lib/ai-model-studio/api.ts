// Real backend calls for the AI Model Studio panel — swapped in once
// Supabase's DATABASE_URL went live. This is the one file components import;
// the shape of GenerationView/GenerationVariantView never changed from the
// mock, so no component above this needed to change.
import { ApparelCategory, JewelryCategory, RingFinger, AIStudioFlow, GenerationView, GenerationVariantView } from "./types";
import { isDataFeatureSlug } from "./effects";

export type StartGenerationInput = {
  file: File | null;
  flow: AIStudioFlow;
  garmentCategory?: ApparelCategory;
  jewelryCategory?: JewelryCategory;
  ringFinger?: RingFinger;
  ringWearingLocation?: number;
  shadeHex?: string;
  /** Required when flow is "effect" — see lib/ai-model-studio/effects.ts. */
  effectId?: string;
  effectParams?: Record<string, unknown>;
  refFile?: File | null;
  referenceModelIds: string[];
  prompt?: string;
  resolution?: "480" | "720" | "1080";
  durationSeconds?: 5 | 10;
  /** Alternative to `file` for the jewelry flow — an already-hosted product photo URL, used by Jewelry Studio's "Preview on a model" action. */
  refImageUrl?: string;
};

function toVariantView(v: any): GenerationVariantView {
  return {
    id: v.id,
    referenceModelLabel: v.referenceModel?.label ?? (v.youcamFeature === "image-to-video" ? "Video clip" : "Reference model"),
    status: v.status,
    resultImageUrl: v.resultImageUrl ?? undefined,
    isVideo: v.youcamFeature === "image-to-video",
    isAnalysis: isDataFeatureSlug(v.youcamFeature),
    analysisResult: v.analysisResult ?? undefined,
    errorMessage: v.errorMessage ?? undefined,
    colorHarmonyScore: v.colorHarmonyScore ?? undefined,
    colorHarmonyNote: v.colorHarmonyNote ?? undefined,
    isBestMatch: v.isBestMatch ?? undefined,
  };
}

function toGenerationView(g: any): GenerationView {
  return {
    id: g.id,
    status: g.status,
    errorMessage: g.errorMessage ?? undefined,
    variants: (g.variants ?? []).map(toVariantView),
    garmentColorHex: g.garmentColorHex ?? undefined,
  };
}

export async function startGeneration(input: StartGenerationInput): Promise<GenerationView> {
  const form = new FormData();
  if (input.file) form.set("file", input.file);
  form.set("flow", input.flow);
  if (input.garmentCategory) form.set("garmentCategory", input.garmentCategory);
  if (input.jewelryCategory) form.set("jewelryCategory", input.jewelryCategory);
  if (input.ringFinger) form.set("ringFinger", input.ringFinger);
  if (input.ringWearingLocation !== undefined) form.set("ringWearingLocation", String(input.ringWearingLocation));
  if (input.effectId) form.set("effectId", input.effectId);
  if (input.effectParams) form.set("params", JSON.stringify(input.effectParams));
  if (input.refFile) form.set("refFile", input.refFile);
  if (input.shadeHex) form.set("shadeHex", input.shadeHex);
  if (input.prompt) form.set("prompt", input.prompt);
  if (input.resolution) form.set("resolution", input.resolution);
  if (input.durationSeconds) form.set("durationSeconds", String(input.durationSeconds));
  if (input.refImageUrl) form.set("refImageUrl", input.refImageUrl);
  input.referenceModelIds.forEach((id) => form.append("referenceModelId", id));

  const res = await fetch("/api/generations", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Failed to start generation.");

  return {
    id: json.generationId,
    status: "processing",
    variants: (json.variants ?? []).map(toVariantView),
  };
}

export async function pollGeneration(generation: GenerationView): Promise<GenerationView> {
  const res = await fetch(`/api/generations/${generation.id}/status`);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? "Failed to check generation status.");
  return toGenerationView(json.generation);
}
