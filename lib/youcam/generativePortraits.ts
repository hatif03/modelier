// AI Avatar Generator, AI Headshot Generator, and AI Studio Generator — three
// template-pack-driven full-generation flows: a selfie in, a set of
// stylized/professional portraits out. Same "listTemplates + template_id"
// shape as hair.ts's hairstyle/beard-style transfer effects, but each is its
// own top-level AIStudioFlow rather than an "effect" — these replace the
// whole photo rather than tweak one property of it, and can return MULTIPLE
// output images per call (`output_count`, 1-200), unlike any effect above.
// Schema confirmed against the real OpenAPI YAML bundles at
// https://docs.perfectcorp.com/_bundle/reference/{ai_avatar_generator,
// ai_headshot_generator, ai_studio_generator}.yaml — all three share the
// exact same request/response shape (RunWithSingleTemplateAndSrcUrl +
// RunWithOutputCntCustom200 → TaskStatusResponseBodyMultiUrlResultsV2).
import { createTask, getTaskStatus, listTemplates, withSrcFile, type SrcFileInput } from "./client";

export type GenerativePortraitCategory = "avatar" | "headshot" | "studio";

export const GENERATIVE_PORTRAIT_FEATURE_SLUGS: Record<GenerativePortraitCategory, string> = {
  avatar: "ai-avatar",
  headshot: "headshot",
  studio: "ai-studio",
};

export async function listGenerativePortraitTemplates(category: GenerativePortraitCategory) {
  return listTemplates(GENERATIVE_PORTRAIT_FEATURE_SLUGS[category]);
}

export type GenerativePortraitInput = SrcFileInput & { templateId: string; outputCount?: number };

export async function createGenerativePortraitTask(
  category: GenerativePortraitCategory,
  input: GenerativePortraitInput
): Promise<string> {
  const payload: Record<string, unknown> = {
    template_id: input.templateId,
    output_count: input.outputCount ?? 1,
  };
  withSrcFile(payload, input, `createGenerativePortraitTask(${category})`);
  return createTask(GENERATIVE_PORTRAIT_FEATURE_SLUGS[category], payload);
}

export type GenerativePortraitResult = { output?: Array<{ url: string }> };

export async function getGenerativePortraitStatus(category: GenerativePortraitCategory, taskId: string) {
  return getTaskStatus<GenerativePortraitResult>(GENERATIVE_PORTRAIT_FEATURE_SLUGS[category], taskId);
}

export function generativePortraitFeatureToCategory(feature: string): GenerativePortraitCategory | undefined {
  return (
    (Object.entries(GENERATIVE_PORTRAIT_FEATURE_SLUGS).find(([, slug]) => slug === feature)?.[0] as
      | GenerativePortraitCategory
      | undefined) ?? undefined
  );
}
