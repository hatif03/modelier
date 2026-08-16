// AI Photo Enhance, Photo Lighting, Background Blur, Background Change,
// Photo Colorize, Color Correction, Background Removal, Object Removal Pro,
// AI Replace, and Image Extender — ten general-purpose photo editors that
// work on ANY photo (product shots, backdrops, arbitrary uploads), not just
// a fashion/beauty model photo. Deliberately kept in their own "Photo
// Editing" UI category, separate from Adobe Firefly's not-yet-live Magic
// Expand/Magic Eraser (lib/firefly/client.ts) — same rough job (outpaint/
// eraser/replace), different provider; never conflate the two.
// Schema confirmed against the real OpenAPI YAML bundles at
// https://docs.perfectcorp.com/_bundle/reference/{ai_photo_enhance,
// ai_photo_lighting, ai_photo_background_blur, ai_photo_background_change,
// ai_photo_colorize, ai_color_correction, ai_background_removal,
// ai_object_removal_pro, ai_replace, ai_image_extender}.yaml — note several
// feature slugs differ from the endpoint's own doc-page name (background
// removal is `sod`, color correction is nested under `colorize/color-correct`,
// object removal pro is `generative-fill`).
import { createTask, getTaskStatus, listTemplates, withSrcFile, withMskFile, type SrcFileInput, type MskFileInput } from "./client";

export type SimplePhotoEditResult = { url: string };

// ---- AI Photo Enhance — flat src-in, upscaled/cleaned photo out. `scale`
// (1, 2, or 4) is REQUIRED — missing here originally, a real bug caught only
// by actually running this for real (every call failed with
// InvalidParameters); confirmed against https://docs.perfectcorp.com/_bundle/
// reference/ai_photo_enhance.yaml.
export async function createEnhanceTask(input: SrcFileInput & { scale?: 1 | 2 | 4 }): Promise<string> {
  const payload: Record<string, unknown> = { scale: input.scale ?? 2 };
  withSrcFile(payload, input, "createEnhanceTask");
  return createTask("enhance", payload);
}
export async function getEnhanceStatus(taskId: string) {
  return getTaskStatus<SimplePhotoEditResult>("enhance", taskId);
}

// ---- AI Photo Lighting — flat src-in, relit photo out.
export async function createPhotoLightingTask(input: SrcFileInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createPhotoLightingTask");
  return createTask("lighting", payload);
}
export async function getPhotoLightingStatus(taskId: string) {
  return getTaskStatus<SimplePhotoEditResult>("lighting", taskId);
}

// ---- AI Background Removal — feature slug is `sod` (salient object detection), not "background-removal".
export async function createBackgroundRemovalTask(input: SrcFileInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createBackgroundRemovalTask");
  return createTask("sod", payload);
}
export async function getBackgroundRemovalStatus(taskId: string) {
  return getTaskStatus<SimplePhotoEditResult>("sod", taskId);
}

// ---- AI Photo Background Blur — src + optional blur intensity (0-100).
export type BackgroundBlurInput = SrcFileInput & { intensity?: number };
export async function createBackgroundBlurTask(input: BackgroundBlurInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createBackgroundBlurTask");
  if (input.intensity !== undefined) payload.intensity = input.intensity;
  return createTask("bg-blur", payload);
}
export async function getBackgroundBlurStatus(taskId: string) {
  return getTaskStatus<SimplePhotoEditResult>("bg-blur", taskId);
}

// ---- AI Photo Background Change — `type` ("prompt"|"template", default
// "prompt") is the real field name, not "mode" as some third-party writeups
// imply. `prompt` is optional even in prompt mode (falls back to a default
// background rather than erroring) but is exposed as a UI text field since a
// described background is the whole point of choosing this effect.
export type BackgroundChangeInput = SrcFileInput & { type?: "prompt" | "template"; prompt?: string; templateId?: string };
export async function listBackgroundChangeTemplates() {
  return listTemplates("bg-replace");
}
export async function createBackgroundChangeTask(input: BackgroundChangeInput): Promise<string> {
  const payload: Record<string, unknown> = { type: input.type ?? "prompt" };
  withSrcFile(payload, input, "createBackgroundChangeTask");
  if (input.prompt) payload.prompt = input.prompt;
  if (input.templateId) payload.template_id = input.templateId;
  return createTask("bg-replace", payload);
}
export async function getBackgroundChangeStatus(taskId: string) {
  return getTaskStatus<SimplePhotoEditResult>("bg-replace", taskId);
}

// ---- Colorize and Color Correction both return MULTIPLE graded/tinted
// variants per call (confirmed via the shared OpenAPI components: colorize's
// status response resolves to the multi-url `{output:[{url}]}` shape, not a
// single `{url}` — matching the doc copy's "4 different colorized versions").
// The status route fans these out into sibling GenerationVariant rows the
// same way a diversity batch does.
export type MultiPhotoEditResult = { output?: Array<{ url: string }> };

export async function createColorizeTask(input: SrcFileInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createColorizeTask");
  return createTask("colorize", payload);
}
export async function getColorizeStatus(taskId: string) {
  return getTaskStatus<MultiPhotoEditResult>("colorize", taskId);
}

// Nested feature path — createTask/getTaskStatus interpolate this straight
// into the URL, so a slug containing a "/" works with no special-casing.
const COLOR_CORRECTION_FEATURE = "colorize/color-correct";
export async function createColorCorrectionTask(input: SrcFileInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createColorCorrectionTask");
  return createTask(COLOR_CORRECTION_FEATURE, payload);
}
export async function getColorCorrectionStatus(taskId: string) {
  return getTaskStatus<MultiPhotoEditResult>(COLOR_CORRECTION_FEATURE, taskId);
}

// ---- AI Object Removal Pro — feature slug is `generative-fill`. Src photo +
// a required grayscale mask (white = area to remove); no prompt — the model
// infers a plausible fill on its own, unlike AI Replace below.
export async function createObjectRemovalProTask(input: SrcFileInput & MskFileInput): Promise<string> {
  const payload: Record<string, unknown> = {};
  withSrcFile(payload, input, "createObjectRemovalProTask");
  withMskFile(payload, input, "createObjectRemovalProTask");
  return createTask("generative-fill", payload);
}
export async function getObjectRemovalProStatus(taskId: string) {
  return getTaskStatus<SimplePhotoEditResult>("generative-fill", taskId);
}

// ---- AI Replace — src photo + a required mask + a required text prompt
// describing what should appear in the masked area.
export type ReplaceInput = SrcFileInput & MskFileInput & { prompt: string };
export async function createReplaceTask(input: ReplaceInput): Promise<string> {
  const payload: Record<string, unknown> = { prompt: input.prompt };
  withSrcFile(payload, input, "createReplaceTask");
  withMskFile(payload, input, "createReplaceTask");
  return createTask("obj-replace", payload);
}
export async function getReplaceStatus(taskId: string) {
  return getTaskStatus<SimplePhotoEditResult>("obj-replace", taskId);
}

// ---- AI Image Extender (out-paint) — confirmed field names: output_width/
// output_height are the final canvas size; input_x/input_y/input_width/
// input_height place the original photo within that new canvas. v1 always
// centers the source (no manual placement UI) — the only user-facing choice
// is the target aspect ratio, computed from the source image's natural size.
export type ImageExtenderInput = SrcFileInput & {
  outputWidth: number;
  outputHeight: number;
  inputX: number;
  inputY: number;
  inputWidth: number;
  inputHeight: number;
  cropInputX: number;
  cropInputY: number;
  cropInputWidth: number;
  cropInputHeight: number;
};
export async function createImageExtenderTask(input: ImageExtenderInput): Promise<string> {
  const payload: Record<string, unknown> = {
    output_width: input.outputWidth,
    output_height: input.outputHeight,
    input_x: input.inputX,
    input_y: input.inputY,
    input_width: input.inputWidth,
    input_height: input.inputHeight,
    crop_input_x: input.cropInputX,
    crop_input_y: input.cropInputY,
    crop_input_width: input.cropInputWidth,
    crop_input_height: input.cropInputHeight,
  };
  withSrcFile(payload, input, "createImageExtenderTask");
  return createTask("out-paint", payload);
}
export async function getImageExtenderStatus(taskId: string) {
  return getTaskStatus<SimplePhotoEditResult>("out-paint", taskId);
}
