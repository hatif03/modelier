// AI Body Reshape, Breast Augmentation, and Abs Filter. Schema confirmed
// against https://docs.perfectcorp.com/reference/ai_body_reshape,
// ai_breast_augmentation, and ai_abs_filter (fetched via the `.md`-suffix
// trick).
import { createTask, getTaskStatus, createTaskWithPreprocess, withSrcFile, type SrcFileInput } from "./client";

// ---- Body reshape — preprocess (body detection) + main; -100..100 sliders.
export type BodyReshapeInput = SrcFileInput & {
  arm?: number;
  waist?: number;
  belly?: number;
  hip?: number;
  hipLift?: number;
  leg?: number;
  slim?: number;
  taller?: number;
  breastLeft?: number;
  breastRight?: number;
  shoulderLeft?: number;
  shoulderRight?: number;
  squaredShoulderLeft?: number;
  squaredShoulderRight?: number;
  neckLeft?: number;
  neckRight?: number;
};

export const BODY_RESHAPE_NATURAL_PRESET: Omit<BodyReshapeInput, "srcFileId" | "srcFileUrl"> = {
  waist: 20,
  belly: 20,
  hip: 10,
  leg: 10,
  slim: 15,
};

export type BodyReshapePrepResult = { bodies?: Array<{ index: number }> };

export async function createBodyReshapeTask(input: BodyReshapeInput): Promise<string> {
  const prepPayload: Record<string, unknown> = {};
  withSrcFile(prepPayload, input, "createBodyReshapeTask");

  return createTaskWithPreprocess<BodyReshapePrepResult>("body-reshape", prepPayload, () => {
    const mainPayload: Record<string, unknown> = {};
    withSrcFile(mainPayload, input, "createBodyReshapeTask");
    const features: Record<string, number | undefined> = {
      arm: input.arm,
      waist: input.waist,
      belly: input.belly,
      hip: input.hip,
      hip_lift: input.hipLift,
      leg: input.leg,
      slim: input.slim,
      taller: input.taller,
      breast_left: input.breastLeft,
      breast_right: input.breastRight,
      shoulder_left: input.shoulderLeft,
      shoulder_right: input.shoulderRight,
      squared_shoulder_left: input.squaredShoulderLeft,
      squared_shoulder_right: input.squaredShoulderRight,
      neck_left: input.neckLeft,
      neck_right: input.neckRight,
    };
    const featurePayload: Record<string, number> = {};
    for (const [key, value] of Object.entries(features)) if (value !== undefined) featurePayload[key] = value;
    mainPayload.features = featurePayload;
    return mainPayload;
  });
}

export type BodyReshapeResult = { url: string };

export async function getBodyReshapeStatus(taskId: string) {
  return getTaskStatus<BodyReshapeResult>("body-reshape", taskId);
}

// ---- Breast augmentation — flat; intensity 1–3.
export async function createBreastAugmentationTask(input: SrcFileInput & { intensity?: 1 | 2 | 3 }): Promise<string> {
  const payload: Record<string, unknown> = { intensity: input.intensity ?? 2 };
  withSrcFile(payload, input, "createBreastAugmentationTask");
  return createTask("breast-shape", payload);
}

export type BreastAugmentationResult = { url: string };

export async function getBreastAugmentationStatus(taskId: string) {
  return getTaskStatus<BreastAugmentationResult>("breast-shape", taskId);
}

// ---- Abs filter — flat; mode + intensity.
export type AbsFilterMode = "Six-pack" | "Vest-line";

export async function createAbsFilterTask(input: SrcFileInput & { mode?: AbsFilterMode; intensity?: number }): Promise<string> {
  const payload: Record<string, unknown> = { mode: input.mode ?? "Vest-line", intensity: input.intensity ?? 0.5 };
  withSrcFile(payload, input, "createAbsFilterTask");
  return createTask("abs-shape", payload);
}

export type AbsFilterResult = { url: string };

export async function getAbsFilterStatus(taskId: string) {
  return getTaskStatus<AbsFilterResult>("abs-shape", taskId);
}
