// AI Hairstyle, Hair Extension, Hair Volume, Bangs, Wavy Hair, Beard Style
// (all template-or-reference transfer effects sharing one request/response
// shape), and Hair Color (its own payload shape). Schema confirmed against
// https://docs.perfectcorp.com/reference/ai_hairstyle, ai_hair_extension,
// ai_hair_volume, ai_bangs, ai_wavy_hair, ai_beard_style, ai_hair_color
// (fetched via the `.md`-suffix trick).
import { createTask, getTaskStatus, listTemplates, withSrcFile, type SrcFileInput } from "./client";

export type HairTemplateCategory = "hairstyle" | "extension" | "volume" | "bangs" | "wavy" | "beard";

export const HAIR_TEMPLATE_FEATURE_SLUGS: Record<HairTemplateCategory, string> = {
  hairstyle: "hair-transfer",
  extension: "hair-ext",
  volume: "hair-vol",
  bangs: "hair-bang",
  wavy: "hair-curl",
  beard: "beard-style",
};

export type HairTemplateInput = SrcFileInput & {
  templateId?: string;
  refFileId?: string;
  refFileUrl?: string;
};

export async function listHairTemplates(category: HairTemplateCategory) {
  return listTemplates(HAIR_TEMPLATE_FEATURE_SLUGS[category]);
}

export async function createHairTemplateTask(category: HairTemplateCategory, input: HairTemplateInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createHairTemplateTask");

  if (input.templateId) payload.template_id = input.templateId;
  else if (input.refFileId) payload.ref_file_id = input.refFileId;
  else if (input.refFileUrl) payload.ref_file_url = input.refFileUrl;
  else throw new Error("createHairTemplateTask requires a templateId, refFileId, or refFileUrl");

  return createTask(HAIR_TEMPLATE_FEATURE_SLUGS[category], payload);
}

export type HairTemplateResult = { url: string };

export async function getHairTemplateStatus(category: HairTemplateCategory, taskId: string) {
  return getTaskStatus<HairTemplateResult>(HAIR_TEMPLATE_FEATURE_SLUGS[category], taskId);
}

export function hairTemplateFeatureToCategory(feature: string): HairTemplateCategory | undefined {
  return (Object.entries(HAIR_TEMPLATE_FEATURE_SLUGS).find(([, slug]) => slug === feature)?.[0] as HairTemplateCategory) ?? undefined;
}

// ---- Hair color — preset name takes priority over a custom pattern/palette.
export type HairColorInput = SrcFileInput & {
  preset?: string;
  pattern?: string;
  palettes?: Array<{ color: string; ratio?: number }>;
  custom?: { color: string };
};

export async function createHairColorTask(input: HairColorInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createHairColorTask");

  if (input.preset) payload.preset = input.preset;
  else if (input.pattern && input.palettes) {
    payload.pattern = input.pattern;
    payload.palettes = input.palettes;
  } else if (input.custom) payload.custom = input.custom;
  else throw new Error("createHairColorTask requires a preset, a pattern+palettes pair, or a custom color");

  return createTask("hair-color", payload);
}

export type HairColorResult = { url: string };

export async function getHairColorStatus(taskId: string) {
  return getTaskStatus<HairColorResult>("hair-color", taskId);
}
