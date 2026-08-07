// Single dispatch point for every "single effect" AI Studio flow added on top
// of the original four (apparel/jewelry/makeup/video, still handled directly
// in app/api/generations/route.ts). Both the submit route and the status
// route import from here instead of each maintaining their own ~28-branch
// switch — one table, read in both directions.
import type { SrcFileInput, RefFileInput, TaskStatus } from "./client";
import { createSkinAnalysisTask, getSkinAnalysisStatus, createSkinSimulationTask, getSkinSimulationStatus, createFitzpatrickSkinTypeTask, getFitzpatrickSkinTypeStatus } from "./skin";
import { createSkinToneAnalysisTask, getSkinToneAnalysisStatus } from "./skinToneAnalysis";
import {
  createFaceAnalyzerTask, getFaceAnalyzerStatus,
  createFaceLiftTask, getFaceLiftStatus,
  createFaceReshapeTask, getFaceReshapeStatus,
  createFaceSwapTask, getFaceSwapStatus,
  createAgingSimulationTask, getAgingSimulationStatus,
  createSmileTask, getSmileStatus,
  createTeethWhiteningTask, getTeethWhiteningStatus,
} from "./face";
import { createBodyReshapeTask, getBodyReshapeStatus, createBreastAugmentationTask, getBreastAugmentationStatus, createAbsFilterTask, getAbsFilterStatus } from "./body";
import {
  createHairColorTask, getHairColorStatus,
  createHairTemplateTask, getHairTemplateStatus, hairTemplateFeatureToCategory,
  HAIR_TEMPLATE_FEATURE_SLUGS,
  type HairTemplateCategory,
} from "./hair";
import {
  createFabricTask, getFabricStatus,
  createEyeColorLensTask, getEyeColorLensStatus,
  createStyleAccessoryTask, getStyleAccessoryStatus, styleAccessoryFeatureToCategory,
  type StyleAccessoryCategory,
} from "./fashionAccessories";
import { createMakeupTransferTask, getMakeupTransferStatus } from "./makeupVto";
import { createNailVtoTask, getNailVtoStatus, type NailFingerEffect } from "./nail";

export type EffectId =
  | "skin_analysis"
  | "skin_simulation"
  | "skin_tone_analysis"
  | "fitzpatrick_skin_type"
  | "face_analyzer"
  | "face_lift"
  | "face_reshape"
  | "face_swap"
  | "aging_simulation"
  | "smile"
  | "teeth_whitening"
  | "body_reshape"
  | "breast_augmentation"
  | "abs_filter"
  | "hair_color"
  | "hairstyle"
  | "hair_extension"
  | "hair_volume"
  | "bangs"
  | "wavy_hair"
  | "beard_style"
  | "fabric"
  | "eye_color_lens"
  | "makeup_transfer"
  | "nail_vto"
  | "shoes"
  | "hat"
  | "bag"
  | "scarf";

// Effects that return scores/metrics rather than a rendered image — the
// caller stores the result in GenerationVariant.analysisResult instead of
// resultImageUrl, and the UI shows a score card instead of a photo.
export const DATA_EFFECTS: ReadonlySet<EffectId> = new Set([
  "skin_analysis",
  "skin_tone_analysis",
  "fitzpatrick_skin_type",
  "face_analyzer",
]);

const HAIR_TEMPLATE_EFFECTS: Partial<Record<EffectId, HairTemplateCategory>> = {
  hairstyle: "hairstyle",
  hair_extension: "extension",
  hair_volume: "volume",
  bangs: "bangs",
  wavy_hair: "wavy",
  beard_style: "beard",
};

const STYLE_ACCESSORY_EFFECTS: Partial<Record<EffectId, StyleAccessoryCategory>> = {
  shoes: "shoes",
  hat: "hat",
  bag: "bag",
  scarf: "scarf",
};

export type EffectInput = SrcFileInput &
  RefFileInput & {
    templateId?: string;
    gender?: "male" | "female";
    style?: string;
  };

// `params` carries whatever the UI's per-effect slider/select controls
// collected — a loosely-typed bag by design, since this one dispatch table
// spans 28 differently-shaped wrapper inputs. Each case below picks the
// specific fields its wrapper actually needs.
export async function createEffectTask(
  effectId: EffectId,
  input: EffectInput,
  params: Record<string, unknown> = {}
): Promise<{ taskId: string; feature: string }> {
  const hairCategory = HAIR_TEMPLATE_EFFECTS[effectId];
  if (hairCategory) {
    // The UI's template-swatch control puts the chosen id in `params.templateId`
    // (see lib/ai-model-studio/effects.ts's EffectTemplateControl) rather than
    // on `input`, so every effect's per-choice knobs flow through one channel.
    const templateId = (params.templateId as string | undefined) ?? input.templateId;
    const taskId = await createHairTemplateTask(hairCategory, { ...input, templateId });
    return { taskId, feature: HAIR_TEMPLATE_FEATURE_SLUGS[hairCategory] };
  }

  const accessoryCategory = STYLE_ACCESSORY_EFFECTS[effectId];
  if (accessoryCategory) {
    const style = (params.style as string | undefined) ?? input.style ?? "random";
    const gender = (params.gender as "male" | "female" | undefined) ?? input.gender;
    const taskId = await createStyleAccessoryTask(accessoryCategory, { ...input, style, gender });
    return { taskId, feature: accessoryCategory };
  }

  switch (effectId) {
    case "skin_analysis":
      return { taskId: await createSkinAnalysisTask({ ...input, actions: params.actions as any }), feature: "skin-analysis" };
    case "skin_simulation":
      return { taskId: await createSkinSimulationTask({ ...input, ...params }), feature: "skin-simulation" };
    case "skin_tone_analysis":
      return { taskId: await createSkinToneAnalysisTask(input), feature: "skin-tone-analysis" };
    case "fitzpatrick_skin_type":
      return { taskId: await createFitzpatrickSkinTypeTask(input), feature: "fitzpatrick-scale-analyzer" };
    case "face_analyzer":
      return { taskId: await createFaceAnalyzerTask(input), feature: "face-attr-analysis" };
    case "face_lift":
      return { taskId: await createFaceLiftTask({ ...input, ...params }), feature: "face-lift" };
    case "face_reshape":
      return { taskId: await createFaceReshapeTask({ ...input, ...params }), feature: "face-reshape" };
    case "face_swap":
      return { taskId: await createFaceSwapTask(input), feature: "face-swap" };
    case "aging_simulation":
      return { taskId: await createAgingSimulationTask(input), feature: "aging" };
    case "smile":
      return { taskId: await createSmileTask({ ...input, style: params.style as any }), feature: "ai-smile" };
    case "teeth_whitening":
      return { taskId: await createTeethWhiteningTask({ ...input, ...params }), feature: "teeth-whiten" };
    case "body_reshape":
      return { taskId: await createBodyReshapeTask({ ...input, ...params }), feature: "body-reshape" };
    case "breast_augmentation":
      return { taskId: await createBreastAugmentationTask({ ...input, ...params }), feature: "breast-shape" };
    case "abs_filter":
      return { taskId: await createAbsFilterTask({ ...input, ...params }), feature: "abs-shape" };
    case "hair_color":
      return { taskId: await createHairColorTask({ ...input, ...params }), feature: "hair-color" };
    case "fabric": {
      const templateId = (params.templateId as string | undefined) ?? input.templateId;
      if (!templateId) throw new Error("fabric requires a templateId");
      return { taskId: await createFabricTask({ ...input, templateId }), feature: "fabric" };
    }
    case "eye_color_lens":
      return { taskId: await createEyeColorLensTask(input), feature: "eye-color-vto" };
    case "makeup_transfer":
      return { taskId: await createMakeupTransferTask(input), feature: "mu-transfer" };
    case "nail_vto": {
      // The UI's controls (see EFFECTS' "nail_vto" entry) are one flat set of
      // sliders/a type select, not a per-finger form — applied identically to
      // all five fingers here rather than asking a first-time user to
      // configure each one individually.
      const finger: NailFingerEffect["finger"][] = ["thumb", "index", "middle", "ring", "pinky"];
      const effects: NailFingerEffect[] = finger.map((f) => ({
        finger: f,
        reflection: params.reflection as number | undefined,
        shimmer: params.shimmer as number | undefined,
        transparency: params.transparency as number | undefined,
        contrast: params.contrast as number | undefined,
        roughness: params.roughness as number | undefined,
      }));
      const taskId = await createNailVtoTask({
        ...input,
        effectType: (params.effectType as "nail_polish" | "press_on_nails" | undefined) ?? "nail_polish",
        effects,
      });
      return { taskId, feature: "nail-vto" };
    }
    default:
      throw new Error(`Unknown effect: ${effectId}`);
  }
}

export async function getEffectStatus(feature: string, taskId: string): Promise<TaskStatus<any>> {
  const hairCategory = hairTemplateFeatureToCategory(feature);
  if (hairCategory) return getHairTemplateStatus(hairCategory, taskId);

  const accessoryCategory = styleAccessoryFeatureToCategory(feature);
  if (accessoryCategory) return getStyleAccessoryStatus(accessoryCategory, taskId);

  switch (feature) {
    case "skin-analysis":
      return getSkinAnalysisStatus(taskId);
    case "skin-simulation":
      return getSkinSimulationStatus(taskId);
    case "skin-tone-analysis":
      return getSkinToneAnalysisStatus(taskId);
    case "fitzpatrick-scale-analyzer":
      return getFitzpatrickSkinTypeStatus(taskId);
    case "face-attr-analysis":
      return getFaceAnalyzerStatus(taskId);
    case "face-lift":
      return getFaceLiftStatus(taskId);
    case "face-reshape":
      return getFaceReshapeStatus(taskId);
    case "face-swap":
      return getFaceSwapStatus(taskId);
    case "aging":
      return getAgingSimulationStatus(taskId);
    case "ai-smile":
      return getSmileStatus(taskId);
    case "teeth-whiten":
      return getTeethWhiteningStatus(taskId);
    case "body-reshape":
      return getBodyReshapeStatus(taskId);
    case "breast-shape":
      return getBreastAugmentationStatus(taskId);
    case "abs-shape":
      return getAbsFilterStatus(taskId);
    case "hair-color":
      return getHairColorStatus(taskId);
    case "fabric":
      return getFabricStatus(taskId);
    case "eye-color-vto":
      return getEyeColorLensStatus(taskId);
    case "mu-transfer":
      return getMakeupTransferStatus(taskId);
    case "nail-vto":
      return getNailVtoStatus(taskId);
    default:
      return { status: "error", errorMessage: `Unknown feature: ${feature}` };
  }
}

// Given a stored youcamFeature string, is this a data-output effect? Mirrors
// DATA_EFFECTS but keyed by the feature slug actually persisted on the
// variant, since that's all the status route has once a task exists.
const DATA_FEATURE_SLUGS = new Set(["skin-analysis", "skin-tone-analysis", "fitzpatrick-scale-analyzer", "face-attr-analysis"]);

export function isDataFeature(feature: string): boolean {
  return DATA_FEATURE_SLUGS.has(feature);
}
