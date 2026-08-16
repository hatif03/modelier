// Computes the AI Image Extender's (out-paint) placement params from a
// source photo's natural dimensions and a user-picked target aspect ratio.
// v1 always centers the source in the new canvas (no manual pivot UI) — the
// only user-facing choice is which way to extend. Output dimensions are
// capped at 4096px per side per the endpoint's own file-size limits.
export type AspectRatioId = "1:1" | "4:5" | "9:16" | "16:9" | "4:1";

export const ASPECT_RATIOS: Record<AspectRatioId, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  "4:1": 4 / 1,
};

const MAX_DIMENSION = 4096;

export type OutpaintGeometry = {
  outputWidth: number;
  outputHeight: number;
  inputX: number;
  inputY: number;
  inputWidth: number;
  inputHeight: number;
  // crop_input_* is REQUIRED by the real API alongside input_* — it crops the
  // SOURCE image before placement; since v1 always uses the whole source
  // photo with no additional cropping, this is just the source's own full
  // bounds. Missing this entirely was a real bug (every call failed with
  // InvalidParameters) caught only by actually running the effect for real.
  cropInputX: number;
  cropInputY: number;
  cropInputWidth: number;
  cropInputHeight: number;
};

export function computeOutpaintGeometry(srcWidth: number, srcHeight: number, aspectRatioId: AspectRatioId): OutpaintGeometry {
  const targetAspect = ASPECT_RATIOS[aspectRatioId];
  const srcAspect = srcWidth / srcHeight;

  let outputWidth: number;
  let outputHeight: number;
  if (targetAspect >= srcAspect) {
    // Wider target — keep the source's height, extend width.
    outputHeight = srcHeight;
    outputWidth = Math.round(srcHeight * targetAspect);
  } else {
    // Taller target — keep the source's width, extend height.
    outputWidth = srcWidth;
    outputHeight = Math.round(srcWidth / targetAspect);
  }

  outputWidth = Math.min(outputWidth, MAX_DIMENSION);
  outputHeight = Math.min(outputHeight, MAX_DIMENSION);

  return {
    outputWidth,
    outputHeight,
    inputX: Math.max(0, Math.round((outputWidth - srcWidth) / 2)),
    inputY: Math.max(0, Math.round((outputHeight - srcHeight) / 2)),
    inputWidth: srcWidth,
    inputHeight: srcHeight,
    cropInputX: 0,
    cropInputY: 0,
    cropInputWidth: srcWidth,
    cropInputHeight: srcHeight,
  };
}
