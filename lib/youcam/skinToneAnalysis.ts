// AI Facial Color Tones Analyzer ("skin-tone-analysis") — 20 units per call.
// Used ONCE per reference model at seed time (scripts/seed-reference-models.ts),
// never per end-user generation — that's what keeps this affordable.
// Schema confirmed against https://docs.perfectcorp.com/reference/ai_skin_tone_analysis
import { createTask, getTaskStatus } from "./client";

export type FaceAngleStrictness = "strict" | "high" | "medium" | "low" | "flexible";

export type SkinToneAnalysisInput = {
  srcFileId?: string;
  srcFileUrl?: string;
  faceAngleStrictnessLevel?: FaceAngleStrictness;
};

export async function createSkinToneAnalysisTask(input: SkinToneAnalysisInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  if (input.srcFileId) payload.src_file_id = input.srcFileId;
  else if (input.srcFileUrl) payload.src_file_url = input.srcFileUrl;
  else throw new Error("createSkinToneAnalysisTask requires either srcFileId or srcFileUrl");

  if (input.faceAngleStrictnessLevel) payload.face_angle_strictness_level = input.faceAngleStrictnessLevel;

  return createTask("skin-tone-analysis", payload);
}

export type SkinToneAnalysisResult = {
  color?: {
    skin_color?: string;
    eye_color?: string;
    eye_color_name?: string;
    lip_color?: string;
    eyebrow_color?: string;
    hair_color?: string;
    hair_color_name?: string;
  };
};

export async function getSkinToneAnalysisStatus(taskId: string) {
  return getTaskStatus<SkinToneAnalysisResult>("skin-tone-analysis", taskId);
}
