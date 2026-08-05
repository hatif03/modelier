// Image-to-Video — animates a single still image into a short clip.
// 1-3 units/clip depending on resolution/duration. Schema confirmed against
// https://docs.perfectcorp.com/reference (task/image-to-video/youcam).
import { createTask, getTaskStatus } from "./client";

export type VideoResolution = "480" | "720" | "1080";

export type ImageToVideoInput = {
  srcFileId?: string;
  srcFileUrl?: string;
  resolution: VideoResolution;
  durationSeconds: 5 | 10;
  prompt: string;
  negativePrompt?: string;
};

export async function createImageToVideoTask(input: ImageToVideoInput): Promise<string> {
  const payload: Record<string, unknown> = {
    model: "youcam-video-v2",
    resolution: input.resolution,
    dst_duration: input.durationSeconds,
    prompt: input.prompt,
  };

  if (input.srcFileId) payload.src_file_id = input.srcFileId;
  else if (input.srcFileUrl) payload.src_file_url = input.srcFileUrl;
  else throw new Error("createImageToVideoTask requires either srcFileId or srcFileUrl");

  if (input.negativePrompt) payload.negative_prompt = input.negativePrompt;

  return createTask("image-to-video/youcam", payload);
}

export type ImageToVideoResult = { url: string };

export async function getImageToVideoStatus(taskId: string) {
  return getTaskStatus<ImageToVideoResult>("image-to-video/youcam", taskId);
}
