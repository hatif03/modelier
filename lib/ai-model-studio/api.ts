// Real backend calls for the AI Model Studio panel — swapped in once
// Supabase's DATABASE_URL went live. This is the one file components import;
// the shape of GenerationView/GenerationVariantView never changed from the
// mock, so no component above this needed to change.
import { ApparelCategory, AIStudioFlow, GenerationView, GenerationVariantView } from "./types";

export type StartGenerationInput = {
  file: File | null;
  flow: AIStudioFlow;
  garmentCategory?: ApparelCategory;
  shadeHex?: string;
  referenceModelIds: string[];
};

function toVariantView(v: any): GenerationVariantView {
  return {
    id: v.id,
    referenceModelLabel: v.referenceModel?.label ?? "Reference model",
    status: v.status,
    resultImageUrl: v.resultImageUrl ?? undefined,
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
  };
}

export async function startGeneration(input: StartGenerationInput): Promise<GenerationView> {
  const form = new FormData();
  if (input.file) form.set("file", input.file);
  form.set("flow", input.flow);
  if (input.garmentCategory) form.set("garmentCategory", input.garmentCategory);
  if (input.shadeHex) form.set("shadeHex", input.shadeHex);
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
