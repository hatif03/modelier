import type { JewelryCategory } from "./jewelryVto";

// Maps YouCam's raw engine/preprocess error codes (see
// https://docs.perfectcorp.com/reference/ai_clothes "Error Codes" section)
// to specific, user-facing explanations — the PRD explicitly requires this
// over a generic failure message or a silently forced low-quality result.
const FRIENDLY_ERRORS: Record<string, string> = {
  error_pose: "We couldn't detect a clear standing pose in that photo. Use one where the person is facing forward, standing upright.",
  error_below_min_image_size: "That photo is too small to use. Please upload an image at least 512×384 pixels.",
  exceed_max_filesize: "That photo is too large. Please upload an image under 10MB.",
  error_invalid_ref: "We couldn't use that reference photo — make sure the garment or person is fully visible and not cropped.",
  error_apply_region_mismatch: "That photo doesn't match the selected category — try a different photo, or switch category.",
  error_invalid_src: "Your photo needs to show more than the lower body or feet. Please upload a fuller photo.",
  invalid_parameter: "That category isn't supported for this photo. Please try a different category.",
  error_download_image: "We couldn't download that photo. Please try uploading it again.",
  error_nsfw_content_detected: "That photo couldn't be processed. Please try a different photo.",
  error_editing_failed: "The result came out too similar to the original photo — please try a different product photo.",
  error_no_face: "We couldn't detect a clear face in that photo. Please use one with the face clearly visible.",
  error_face_angle_downward: "The face angle in that photo is too steep. Please use a more front-facing photo.",
  unknown_internal_error: "Something went wrong generating this render. Please try again.",
};

export function friendlyYoucamError(rawError: string | null | undefined): string {
  if (!rawError) return "Generation failed for an unknown reason. Please try again.";
  return FRIENDLY_ERRORS[rawError] ?? `Generation failed (${rawError}). Please try a different photo.`;
}

// Jewelry-specific hints layered on top of the shared vocabulary above — real jewelry
// error codes are UNCONFIRMED against the live API (see lib/youcam/jewelryVto.ts's
// header comment), so this only overrides the couple of messages that clearly need a
// body-part-specific hint; anything else falls back to the shared map/generic message.
const JEWELRY_HINTS: Partial<Record<JewelryCategory, Record<string, string>>> = {
  ring: {
    error_no_face: "We couldn't detect a clear hand in that photo. Please use one with the hand and fingers fully visible.",
    error_pose: "We couldn't detect a clear hand pose in that photo. Use one with the palm or fingers clearly visible.",
  },
  necklace: {
    error_no_face: "We couldn't detect a clear neck and upper chest area in that photo. Please use a more front-facing photo.",
  },
  earring: {
    error_no_face: "We couldn't detect a clear ear in that photo. Please use one with the ear clearly visible.",
  },
  bracelet: {
    error_no_face: "We couldn't detect a clear wrist in that photo. Please use one with the wrist fully visible.",
    error_pose: "We couldn't detect a clear wrist pose in that photo. Use one with the wrist clearly visible.",
  },
  watch: {
    error_no_face: "We couldn't detect a clear wrist in that photo. Please use one with the wrist fully visible.",
    error_pose: "We couldn't detect a clear wrist pose in that photo. Use one with the wrist clearly visible.",
  },
};

export function friendlyJewelryError(rawError: string | null | undefined, category: JewelryCategory): string {
  if (!rawError) return "Generation failed for an unknown reason. Please try again.";
  return JEWELRY_HINTS[category]?.[rawError] ?? friendlyYoucamError(rawError);
}
