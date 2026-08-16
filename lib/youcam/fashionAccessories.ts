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

// Real, genuinely PER-CATEGORY style-preset enums, confirmed against the
// OpenAPI YAML bundles at https://docs.perfectcorp.com/_bundle/reference/
// {ai_shoes,ai_hat,ai_bag,ai_scarf}.yaml — two real, pre-existing bugs here:
// (1) the values previously here (bare "classic"/"sporty"/"elegant"/
// "streetwear" etc, guessed via the lower-fidelity `.md`-fetch trick) were
// invalid for every category, and a first-pass fix wrongly assumed all four
// categories share one enum — they don't, each has its own distinct set
// (only "random" is universal, and a couple of categories happen to also
// share "style_bohemian"/"style_cottagecore"/"style_french_elegance");
// (2) `gender` is required for ALL FOUR categories (via GenderRunTaskV2),
// not just "shoes" as first assumed — every hat/bag/scarf call failed with
// InvalidParameters until this was caught by actually running them for real.
export const STYLE_ACCESSORY_PRESETS: Record<StyleAccessoryCategory, string[]> = {
  shoes: ["random", "style_minimalist", "style_bohemian", "style_cottagecore", "style_french_elegance", "style_retro_fashion"],
  hat: ["random", "style_sporty_casual", "style_urban_fashion", "style_vacation_casual", "style_warm_cozy", "style_bohemian"],
  bag: ["random", "style_parisian_chic", "style_urban_chic", "style_mediterranean_chic", "style_art_deco_style"],
  scarf: ["random", "style_french_elegance", "style_light_luxury", "style_cottagecore", "style_modern_chic", "style_bohemian"],
};

export type StyleAccessoryInput = SrcFileInput &
  RefFileInput & {
    gender: "male" | "female";
    style: string;
  };

export async function createStyleAccessoryTask(category: StyleAccessoryCategory, input: StyleAccessoryInput): Promise<string> {
  if (!input.gender) throw new Error(`createStyleAccessoryTask requires gender for the ${category} category`);
  const payload: Record<string, unknown> = { style: input.style, gender: input.gender };
  withSrcFile(payload, input, "createStyleAccessoryTask");
  withRefFile(payload, input, "createStyleAccessoryTask");

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

// ---- Eye color lens VTO — a selfie plus a lens-style swatch image. `version`
// and `effect.intensity` are REQUIRED — both were missing here (a real,
// pre-existing bug; every live call failed with InvalidParameters until
// fixed), confirmed against https://docs.perfectcorp.com/_bundle/reference/
// ai_eye_color_lens.yaml.
export type EyeColorLensInput = SrcFileInput &
  RefFileInput & { intensity?: number; enlargement?: number };

export async function createEyeColorLensTask(input: EyeColorLensInput): Promise<string> {
  const payload: Record<string, unknown> = {
    version: "1.0",
    effect: { intensity: input.intensity ?? 80, enlargement: input.enlargement ?? 0 },
  };
  withSrcFile(payload, input, "createEyeColorLensTask");
  withRefFile(payload, input, "createEyeColorLensTask");
  return createTask("eye-color-vto", payload);
}

export type EyeColorLensResult = { url: string };

export async function getEyeColorLensStatus(taskId: string) {
  return getTaskStatus<EyeColorLensResult>("eye-color-vto", taskId);
}
