// AI Skin Analysis, Skin Simulation, and Fitzpatrick Skin Type Analyzer.
// Schema confirmed against https://docs.perfectcorp.com/reference/ai_skin_analysis,
// ai_skin_simulation, and ai_fitzpatrick_skin_type (fetched via the `.md`-suffix
// trick — these reference pages are a JS-rendered SPA otherwise).
import { createTask, getTaskStatus, createTaskWithPreprocess, withSrcFile, type SrcFileInput } from "./client";

// ---- Skin analysis — a DATA result (per-concern scores + mask URLs), not an image.
export type SkinAnalysisAction =
  | "wrinkle"
  | "pore"
  | "texture"
  | "acne"
  | "radiance"
  | "oiliness"
  | "dark_circle"
  | "eye_bag"
  | "redness"
  | "spot";

export type SkinAnalysisInput = SrcFileInput & { actions?: SkinAnalysisAction[] };

export async function createSkinAnalysisTask(input: SkinAnalysisInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createSkinAnalysisTask");
  if (input.actions?.length) payload.dst_actions = input.actions;
  return createTask("skin-analysis", payload);
}

export type SkinAnalysisResult = {
  output?: Array<{ type: SkinAnalysisAction; ui_score: number; raw_score?: number; mask_urls?: string[] }>;
};

export async function getSkinAnalysisStatus(taskId: string) {
  return getTaskStatus<SkinAnalysisResult>("skin-analysis", taskId);
}

// ---- Skin simulation — an IMAGE result; per-concern intensity 0–1.
export type SkinSimulationInput = SrcFileInput & {
  wrinkles?: number;
  radiance?: number;
  oiliness?: number;
  eyeBags?: number;
  darkCircles?: number;
  spots?: number;
  pores?: number;
  texture?: number;
  redness?: number;
};

// Moderate defaults so the "Natural" preset in the UI needs no per-slider
// tuning — most users should be able to hit Generate untouched.
export const SKIN_SIMULATION_NATURAL_PRESET: Omit<SkinSimulationInput, "srcFileId" | "srcFileUrl"> = {
  wrinkles: 0.4,
  radiance: 0.3,
  oiliness: 0.3,
  eyeBags: 0.3,
  darkCircles: 0.3,
  spots: 0.4,
  pores: 0.3,
  texture: 0.3,
  redness: 0.3,
};

export async function createSkinSimulationTask(input: SkinSimulationInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createSkinSimulationTask");

  const intensities: Record<string, number | undefined> = {
    wrinkles: input.wrinkles,
    radiance: input.radiance,
    oiliness: input.oiliness,
    eye_bags: input.eyeBags,
    dark_circles: input.darkCircles,
    spots: input.spots,
    pores: input.pores,
    texture: input.texture,
    redness: input.redness,
  };
  for (const [key, value] of Object.entries(intensities)) {
    if (value !== undefined) payload[key] = value;
  }

  return createTask("skin-simulation", payload);
}

export type SkinSimulationResult = { url: string };

export async function getSkinSimulationStatus(taskId: string) {
  return getTaskStatus<SkinSimulationResult>("skin-simulation", taskId);
}

// ---- Fitzpatrick skin type — preprocess (face detection) then analyze; a DATA result.
export type FitzpatrickPrepResult = { faces?: Array<{ index: number }> };
export type FitzpatrickResult = { result?: "I" | "II" | "III" | "IV" | "V" | "VI" };

export async function createFitzpatrickSkinTypeTask(input: SrcFileInput & { faceIndex?: number }): Promise<string> {
  const prepPayload: Record<string, unknown> = {};
  withSrcFile(prepPayload, input, "createFitzpatrickSkinTypeTask");

  return createTaskWithPreprocess<FitzpatrickPrepResult>(
    "fitzpatrick-scale-analyzer",
    prepPayload,
    () => {
      const mainPayload: Record<string, unknown> = {};
      withSrcFile(mainPayload, input, "createFitzpatrickSkinTypeTask");
      if (input.faceIndex !== undefined) mainPayload.index = input.faceIndex;
      return mainPayload;
    }
  );
}

export async function getFitzpatrickSkinTypeStatus(taskId: string) {
  return getTaskStatus<FitzpatrickResult>("fitzpatrick-scale-analyzer", taskId);
}
