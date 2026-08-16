// AI Face Analyzer, Face Lift, Face Reshape, Face Swap, Aging Simulation, AI
// Smile, and Teeth Whitening. Schema confirmed against
// https://docs.perfectcorp.com/reference/ai_face_analyzer, ai_face_lift,
// ai_face_reshape, ai_face_swap, ai_aging_simulation, ai_smile,
// ai_teeth_whitening (fetched via the `.md`-suffix trick).
import { createTask, getTaskStatus, createTaskWithPreprocess, withSrcFile, type SrcFileInput } from "./client";

// ---- Face analyzer — a DATA result (face shape, ratios, feature metrics).
// The OpenAPI YAML bundle's own documented `BasicRunFaceAttrTask` schema
// (a nested request_id/payload.file_sets/payload.actions shape) turned out
// to NOT be what the live endpoint actually accepts — sending that exact
// shape always failed with InvalidParameters. Confirmed by direct
// experimentation against the live API (the error message for a
// deliberately-wrong request named the fields it actually wanted): the real,
// working shape is flat — {src_file_id or src_file_url, features: [...]}` —
// the same simple pattern every other single-photo effect in this codebase
// uses, not the elaborate nested one the docs describe.
export type FaceAttrFeature =
  | "eyeShape" | "eyeSize" | "eyeAngle" | "eyeDistance" | "eyelid"
  | "eyebrowShape" | "eyebrowThickness" | "eyebrowDistance" | "eyebrowShortness"
  | "cheekbones" | "faceShape" | "lipShape" | "noseWidth" | "noseLength"
  | "age" | "gender" | "eyeColor" | "lipColor" | "eyebrowColor" | "hairColor"
  | "horizontalThird" | "verticalFifth" | "faceAspectRatio" | "eyeAspectRatio"
  | "eyebrowPosition" | "eyebrowArch" | "eyeHeightToEyebrowDistance"
  | "noseAspectRatio" | "noseWidthToMouthWidth" | "noseToLipToChin" | "upperLipToLowerLip";

export const ALL_FACE_ATTR_FEATURES: FaceAttrFeature[] = [
  "eyeShape", "eyeSize", "eyeAngle", "eyeDistance", "eyelid",
  "eyebrowShape", "eyebrowThickness", "eyebrowDistance", "eyebrowShortness",
  "cheekbones", "faceShape", "lipShape", "noseWidth", "noseLength",
  "age", "gender", "eyeColor", "lipColor", "eyebrowColor", "hairColor",
  "horizontalThird", "verticalFifth", "faceAspectRatio", "eyeAspectRatio",
  "eyebrowPosition", "eyebrowArch", "eyeHeightToEyebrowDistance",
  "noseAspectRatio", "noseWidthToMouthWidth", "noseToLipToChin", "upperLipToLowerLip",
];

export type FaceAnalyzerResult = {
  faceShape?: string;
  age?: number;
  gender?: string;
  [metric: string]: unknown;
};

// Defaults to a small, broadly-useful subset rather than every possible
// feature.
const DEFAULT_FACE_ATTR_FEATURES: FaceAttrFeature[] = ["faceShape", "age", "gender", "eyeColor", "hairColor"];

export async function createFaceAnalyzerTask(input: SrcFileInput & { features?: FaceAttrFeature[] }): Promise<string> {
  const payload: Record<string, unknown> = { features: input.features?.length ? input.features : DEFAULT_FACE_ATTR_FEATURES };
  withSrcFile(payload, input, "createFaceAnalyzerTask");
  return createTask("face-attr-analysis", payload);
}

export async function getFaceAnalyzerStatus(taskId: string) {
  return getTaskStatus<FaceAnalyzerResult>("face-attr-analysis", taskId);
}

// ---- Face lift — preprocess (face boxes) + main; 0–100 sliders.
export type FaceLiftInput = SrcFileInput & {
  eyeBags?: number;
  cheeks?: number;
  forehead?: number;
  faceShape?: number;
  mouth?: number;
};

export const FACE_LIFT_NATURAL_PRESET: Omit<FaceLiftInput, "srcFileId" | "srcFileUrl"> = {
  eyeBags: 30,
  cheeks: 20,
  forehead: 20,
  faceShape: 20,
  mouth: 15,
};

export type FaceLiftPrepResult = { faces?: Array<{ index: number }> };

export async function createFaceLiftTask(input: FaceLiftInput): Promise<string> {
  const prepPayload: Record<string, unknown> = {};
  withSrcFile(prepPayload, input, "createFaceLiftTask");

  return createTaskWithPreprocess<FaceLiftPrepResult>("face-lift", prepPayload, () => {
    const mainPayload: Record<string, unknown> = {};
    withSrcFile(mainPayload, input, "createFaceLiftTask");
    const sliders: Record<string, number | undefined> = {
      eye_bags: input.eyeBags,
      cheeks: input.cheeks,
      forehead: input.forehead,
      face_shape: input.faceShape,
      mouth: input.mouth,
    };
    for (const [key, value] of Object.entries(sliders)) if (value !== undefined) mainPayload[key] = value;
    return mainPayload;
  });
}

export type FaceLiftResult = { url: string };

export async function getFaceLiftStatus(taskId: string) {
  return getTaskStatus<FaceLiftResult>("face-lift", taskId);
}

// ---- Face reshape — preprocess + main; -100..100 sliders (0..100 for cheekbones/jaw).
export type FaceReshapeInput = SrcFileInput & {
  eyes?: number;
  face?: number;
  nose?: number;
  lips?: number;
  cheekbones?: number;
  jaw?: number;
};

export const FACE_RESHAPE_NATURAL_PRESET: Omit<FaceReshapeInput, "srcFileId" | "srcFileUrl"> = {
  eyes: 10,
  face: 10,
  nose: 10,
  lips: 5,
  cheekbones: 15,
  jaw: 15,
};

export type FaceReshapePrepResult = { faces?: Array<{ index: number }> };

export async function createFaceReshapeTask(input: FaceReshapeInput): Promise<string> {
  const prepPayload: Record<string, unknown> = {};
  withSrcFile(prepPayload, input, "createFaceReshapeTask");

  return createTaskWithPreprocess<FaceReshapePrepResult>("face-reshape", prepPayload, () => {
    const mainPayload: Record<string, unknown> = {};
    withSrcFile(mainPayload, input, "createFaceReshapeTask");
    const features: Record<string, number | undefined> = {
      eyes: input.eyes,
      face: input.face,
      nose: input.nose,
      lips: input.lips,
      cheekbones: input.cheekbones,
      jaw: input.jaw,
    };
    const featurePayload: Record<string, number> = {};
    for (const [key, value] of Object.entries(features)) if (value !== undefined) featurePayload[key] = value;
    mainPayload.features = featurePayload;
    return mainPayload;
  });
}

export type FaceReshapeResult = { url: string };

export async function getFaceReshapeStatus(taskId: string) {
  return getTaskStatus<FaceReshapeResult>("face-reshape", taskId);
}

// ---- Face swap — preprocess (face boxes) + main. Real main-task shape is
// flat (`ref_file_ids`/`ref_file_urls` PLURAL arrays + a top-level
// `face_mapping` array of {index, position}) — the previous `file_sets`/
// `actions` wrapper here was a real, pre-existing bug (that shape belongs to
// face-attr-analysis, not face-swap; every live call failed with
// InvalidParameters). Confirmed against https://docs.perfectcorp.com/_bundle/
// reference/ai_face_swap.yaml.
export type FaceSwapInput = {
  srcFileId?: string;
  srcFileUrl?: string;
  refFileId?: string;
  refFileUrl?: string;
};

export type FaceSwapPrepResult = { faces?: Array<{ index: number }> };

export async function createFaceSwapTask(input: FaceSwapInput): Promise<string> {
  const prepPayload: Record<string, unknown> = {};
  withSrcFile(prepPayload, input, "createFaceSwapTask");

  return createTaskWithPreprocess<FaceSwapPrepResult>("face-swap", prepPayload, () => {
    const mainPayload: Record<string, unknown> = { face_mapping: [{ index: 0, position: 0 }] };
    withSrcFile(mainPayload, input, "createFaceSwapTask");
    if (input.refFileId) mainPayload.ref_file_ids = [input.refFileId];
    else if (input.refFileUrl) mainPayload.ref_file_urls = [input.refFileUrl];
    else throw new Error("createFaceSwapTask requires either refFileId or refFileUrl");
    return mainPayload;
  });
}

export type FaceSwapResult = { url: string };

export async function getFaceSwapStatus(taskId: string) {
  return getTaskStatus<FaceSwapResult>("face-swap", taskId);
}

// ---- Aging simulation — flat, no extra params.
export async function createAgingSimulationTask(input: SrcFileInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createAgingSimulationTask");
  return createTask("aging", payload);
}

export type AgingSimulationResult = { url: string };

export async function getAgingSimulationStatus(taskId: string) {
  return getTaskStatus<AgingSimulationResult>("aging", taskId);
}

// ---- AI smile.
export type SmileStyle = "smile_with_teeth_visible" | "closed_mouth_smile";

export async function createSmileTask(input: SrcFileInput & { style?: SmileStyle }): Promise<string> {
  const payload: Record<string, unknown> = { style: input.style ?? "smile_with_teeth_visible" };
  withSrcFile(payload, input, "createSmileTask");
  return createTask("ai-smile", payload);
}

export type SmileResult = { url: string };

export async function getSmileStatus(taskId: string) {
  return getTaskStatus<SmileResult>("ai-smile", taskId);
}

// ---- Teeth whitening — preprocess + main; intensity 0–1.
export type TeethWhiteningPrepResult = { faces?: Array<{ index: number }> };

export async function createTeethWhiteningTask(input: SrcFileInput & { intensity?: number }): Promise<string> {
  const prepPayload: Record<string, unknown> = {};
  withSrcFile(prepPayload, input, "createTeethWhiteningTask");

  return createTaskWithPreprocess<TeethWhiteningPrepResult>("teeth-whiten", prepPayload, () => {
    const mainPayload: Record<string, unknown> = { intensity: input.intensity ?? 0.6 };
    withSrcFile(mainPayload, input, "createTeethWhiteningTask");
    return mainPayload;
  });
}

export type TeethWhiteningResult = { url: string };

export async function getTeethWhiteningStatus(taskId: string) {
  return getTaskStatus<TeethWhiteningResult>("teeth-whiten", taskId);
}
