// AI Video Generator (template-based image-to-video v1), Video Enhancer,
// Video Face Swap, Video Background Replace, Video Object Removal, and Video
// Style Transfer — six video-in-or-out features layered on top of
// imageToVideo.ts, which only wraps the already-live PROMPT-based
// "image-to-video/youcam" v2 endpoint. These take/produce real video clips
// and are consumed by Video Studio (components/video/AIPanel.tsx via
// app/api/video/ai-effect/route.ts), not AI Model Studio's effectDispatch —
// Video Studio has no Generation/GenerationVariant concept.
// Schema confirmed against the real OpenAPI YAML bundles at
// https://docs.perfectcorp.com/_bundle/reference/{ai_video_generator,
// ai_video_enhancer, ai_video_face_swap, ai_video_background_replace,
// ai_video_object_removal, ai_video_style_transfer}.yaml — one genuine
// surprise: AI Video Object Removal uploads through its OWN dedicated file
// endpoint (/s2s/v2.0/file/obj-rem-vid), not the shared /s2s/v2.0/file every
// other feature in this codebase uses — see uploadFile()'s featurePath param.
import {
  createTask,
  getTaskStatus,
  listTemplates,
  uploadFile,
  withSrcFile,
  withRefFile,
  withMskFile,
  type SrcFileInput,
  type RefFileInput,
  type MskFileInput,
  type UploadedFile,
} from "./client";

export type VideoResult = { url: string };

// ---- AI Video Generator — template-based image-to-video (v1). Distinct
// from imageToVideo.ts's prompt-based v2 wrapper; feature slug is plain
// "image-to-video" (v2's is "image-to-video/youcam").
export async function listVideoGeneratorTemplates() {
  return listTemplates("image-to-video");
}

export type VideoGeneratorInput = SrcFileInput & { templateId: string; dstDuration: 5 | 10; mode?: "std" | "pro" };

export async function createVideoGeneratorTask(input: VideoGeneratorInput): Promise<string> {
  const payload: Record<string, unknown> = { template_id: input.templateId, dst_duration: input.dstDuration };
  if (input.mode) payload.mode = input.mode;
  withSrcFile(payload, input, "createVideoGeneratorTask");
  return createTask("image-to-video", payload);
}

export async function getVideoGeneratorStatus(taskId: string) {
  return getTaskStatus<VideoResult>("image-to-video", taskId);
}

// ---- AI Video Enhancer (upscale/restore) — feature slug "video-sr".
export type VideoEnhancerInput = SrcFileInput & { dstDuration: number };

export async function createVideoEnhancerTask(input: VideoEnhancerInput): Promise<string> {
  const payload: Record<string, unknown> = { dst_duration: input.dstDuration };
  withSrcFile(payload, input, "createVideoEnhancerTask");
  return createTask("video-sr", payload);
}

export async function getVideoEnhancerStatus(taskId: string) {
  return getTaskStatus<VideoResult>("video-sr", taskId);
}

// ---- AI Video Face Swap — src video + a required reference face photo.
export type VideoFaceSwapInput = SrcFileInput & RefFileInput & { dstDuration: number };

export async function createVideoFaceSwapTask(input: VideoFaceSwapInput): Promise<string> {
  const payload: Record<string, unknown> = { dst_duration: input.dstDuration };
  withSrcFile(payload, input, "createVideoFaceSwapTask");
  withRefFile(payload, input, "createVideoFaceSwapTask");
  return createTask("face-swap-vid", payload);
}

export async function getVideoFaceSwapStatus(taskId: string) {
  return getTaskStatus<VideoResult>("face-swap-vid", taskId);
}

// ---- AI Video Background Replace — src video + a required reference
// background photo; backgroundMode controls how the background image fits.
export type VideoBackgroundReplaceInput = SrcFileInput & RefFileInput & { backgroundMode?: "crop" | "stretch" };

export async function createVideoBackgroundReplaceTask(input: VideoBackgroundReplaceInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  if (input.backgroundMode) payload.background_mode = input.backgroundMode;
  withSrcFile(payload, input, "createVideoBackgroundReplaceTask");
  withRefFile(payload, input, "createVideoBackgroundReplaceTask");
  return createTask("bg-replace-vid", payload);
}

export async function getVideoBackgroundReplaceStatus(taskId: string) {
  return getTaskStatus<VideoResult>("bg-replace-vid", taskId);
}

// ---- AI Video Object Removal — src video + a required mask + the frame
// index the mask corresponds to. Both the source video AND the mask must be
// uploaded through this feature's own dedicated file endpoint, unlike every
// other wrapper in this codebase — see uploadObjectRemovalVideoFile().
export async function uploadObjectRemovalVideoFile(buffer: Buffer, meta: { contentType: string; fileName: string }): Promise<UploadedFile> {
  return uploadFile(buffer, meta, "obj-rem-vid");
}

export type VideoObjectRemovalInput = SrcFileInput & MskFileInput & { frameIdx: number };

export async function createVideoObjectRemovalTask(input: VideoObjectRemovalInput): Promise<string> {
  const payload: Record<string, unknown> = { frame_idx: input.frameIdx };
  withSrcFile(payload, input, "createVideoObjectRemovalTask");
  withMskFile(payload, input, "createVideoObjectRemovalTask");
  return createTask("obj-rem-vid", payload);
}

export async function getVideoObjectRemovalStatus(taskId: string) {
  return getTaskStatus<VideoResult>("obj-rem-vid", taskId);
}

// ---- AI Video Style Transfer — template-based, feature slug "video-trans".
export async function listVideoStyleTransferTemplates() {
  return listTemplates("video-trans");
}

export type VideoStyleTransferInput = SrcFileInput & { templateId: string };

export async function createVideoStyleTransferTask(input: VideoStyleTransferInput): Promise<string> {
  const payload: Record<string, unknown> = { template_id: input.templateId };
  withSrcFile(payload, input, "createVideoStyleTransferTask");
  return createTask("video-trans", payload);
}

export async function getVideoStyleTransferStatus(taskId: string) {
  return getTaskStatus<VideoResult>("video-trans", taskId);
}

export type VideoEffectId = "video_generator" | "video_enhancer" | "video_face_swap" | "video_background_replace" | "video_object_removal" | "video_style_transfer";

export const VIDEO_EFFECT_FEATURE_SLUGS: Record<VideoEffectId, string> = {
  video_generator: "image-to-video",
  video_enhancer: "video-sr",
  video_face_swap: "face-swap-vid",
  video_background_replace: "bg-replace-vid",
  video_object_removal: "obj-rem-vid",
  video_style_transfer: "video-trans",
};

export function videoEffectFeatureToId(feature: string): VideoEffectId | undefined {
  return (
    (Object.entries(VIDEO_EFFECT_FEATURE_SLUGS).find(([, slug]) => slug === feature)?.[0] as VideoEffectId | undefined) ?? undefined
  );
}

// Single dispatch point mirroring effectDispatch.ts's shape, kept local to
// this file since Video Studio's route needs it but has no reason to touch
// the AI Model Studio dispatch table.
export async function getVideoEffectStatus(feature: string, taskId: string) {
  switch (feature) {
    case "image-to-video":
      return getVideoGeneratorStatus(taskId);
    case "video-sr":
      return getVideoEnhancerStatus(taskId);
    case "face-swap-vid":
      return getVideoFaceSwapStatus(taskId);
    case "bg-replace-vid":
      return getVideoBackgroundReplaceStatus(taskId);
    case "obj-rem-vid":
      return getVideoObjectRemovalStatus(taskId);
    case "video-trans":
      return getVideoStyleTransferStatus(taskId);
    default:
      return { status: "error" as const, errorMessage: `Unknown video effect feature: ${feature}` };
  }
}
