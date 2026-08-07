// AI Shoes, Hat, Bag, Scarf (one shared style-preset shape), Fabric Print
// Try-On (template-based), and Eye Color Lens VTO. Schema confirmed against
// https://docs.perfectcorp.com/reference/ai_shoes, ai_hat, ai_bag, ai_scarf,
// ai_fabric, ai_eye_color_lens (fetched via the `.md`-suffix trick).
import { createTask, getTaskStatus, listTemplates, withSrcFile, withRefFile, type SrcFileInput, type RefFileInput } from "./client";

// ---- Shoes / hat / bag / scarf — a selfie, an optional worn/product reference photo,
// and a named style preset render the accessory in a fixed output size.
export type StyleAccessoryCategory = "shoes" | "hat" | "bag" | "scarf";

const STYLE_ACCESSORY_FEATURE_SLUGS: Record<StyleAccessoryCategory, string> = {
  shoes: "shoes",
  hat: "hat",
  bag: "bag",
  scarf: "scarf",
};

// Confirmed style presets — "hat" doesn't document its own preset list, so it
// falls back to a plain string until confirmed against the live API.
export const STYLE_ACCESSORY_PRESETS: Record<StyleAccessoryCategory, string[]> = {
  shoes: ["classic", "sporty", "elegant", "streetwear", "minimalist", "random"],
  scarf: ["french_elegance", "light_luxury", "cottagecore", "modern_chic", "bohemian", "random"],
  bag: ["parisian_chic", "urban_chic", "mediterranean_chic", "art_deco_style", "random"],
  hat: ["random"],
};

export type StyleAccessoryInput = SrcFileInput &
  Partial<RefFileInput> & {
    gender?: "male" | "female";
    style: string;
  };

export async function createStyleAccessoryTask(category: StyleAccessoryCategory, input: StyleAccessoryInput): Promise<string> {
  const payload: Record<string, unknown> = { style: input.style };
  withSrcFile(payload, input, "createStyleAccessoryTask");
  if (input.refFileId) payload.ref_file_id = input.refFileId;
  else if (input.refFileUrl) payload.ref_file_url = input.refFileUrl;
  if (category === "shoes") {
    if (!input.gender) throw new Error("createStyleAccessoryTask requires gender for the shoes category");
    payload.gender = input.gender;
  }

  return createTask(STYLE_ACCESSORY_FEATURE_SLUGS[category], payload);
}

export type StyleAccessoryResult = { url: string };

export async function getStyleAccessoryStatus(category: StyleAccessoryCategory, taskId: string) {
  return getTaskStatus<StyleAccessoryResult>(STYLE_ACCESSORY_FEATURE_SLUGS[category], taskId);
}

export function styleAccessoryFeatureToCategory(feature: string): StyleAccessoryCategory | undefined {
  return (
    (Object.entries(STYLE_ACCESSORY_FEATURE_SLUGS).find(([, slug]) => slug === feature)?.[0] as StyleAccessoryCategory) ?? undefined
  );
}

// ---- Fabric print try-on — template-based, same shape as the hair template packs.
export async function listFabricTemplates() {
  return listTemplates("fabric");
}

export async function createFabricTask(input: SrcFileInput & { templateId: string }): Promise<string> {
  const payload: Record<string, unknown> = { template_id: input.templateId };
  withSrcFile(payload, input, "createFabricTask");
  return createTask("fabric", payload);
}

export type FabricResult = { url: string };

export async function getFabricStatus(taskId: string) {
  return getTaskStatus<FabricResult>("fabric", taskId);
}

// ---- Eye color lens VTO — a selfie plus a lens-style swatch image.
export async function createEyeColorLensTask(input: SrcFileInput & RefFileInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createEyeColorLensTask");
  withRefFile(payload, input, "createEyeColorLensTask");
  return createTask("eye-color-vto", payload);
}

export type EyeColorLensResult = { url: string };

export async function getEyeColorLensStatus(taskId: string) {
  return getTaskStatus<EyeColorLensResult>("eye-color-vto", taskId);
}
