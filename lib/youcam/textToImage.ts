// AI Image Generator V2.0 (text-to-image) — 1 unit per call.
// Used to synthesize the fully-synthetic reference model photos (never a real
// person's photo) for scripts/seed-reference-models.ts.
// Schema confirmed against https://docs.perfectcorp.com/reference/ai_image_generator
import { createTask, getTaskStatus } from "./client";

export type TextToImageSize = "1664*928" | "1472*1104" | "1328*1328" | "1104*1472" | "928*1664";

export type TextToImageInput = {
  prompt: string;
  negativePrompt?: string;
  size?: TextToImageSize;
};

const FEATURE = "text-to-image/youcam";

export async function createTextToImageTask(input: TextToImageInput): Promise<string> {
  return createTask(FEATURE, {
    model: "youcam-image-v2",
    prompt: input.prompt,
    negative_prompt: input.negativePrompt,
    size: input.size ?? "1104*1472",
    prompt_extend: false,
  });
}

export type TextToImageResult = { url: string };

export async function getTextToImageStatus(taskId: string) {
  return getTaskStatus<TextToImageResult>(FEATURE, taskId);
}
