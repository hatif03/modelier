import type { ColorGradePresetId } from "@/lib/video-engine/types";

// One-click grading presets, implemented as canvas `ctx.filter` CSS filter strings
// applied when compositing each frame (see lib/video-engine/renderer.ts) — a
// deliberately lighter-weight stand-in for freecut's full WebGPU LUT pipeline
// (infrastructure/gpu-effects/lut), sized for v1.
export const COLOR_GRADE_PRESETS: { id: ColorGradePresetId; label: string; filter: string }[] = [
  { id: "none", label: "None", filter: "none" },
  { id: "warm", label: "Warm", filter: "saturate(1.15) contrast(1.05) brightness(1.03) sepia(0.12) hue-rotate(-6deg)" },
  { id: "cool", label: "Cool", filter: "saturate(1.05) contrast(1.05) brightness(1.0) hue-rotate(8deg)" },
  { id: "cinematic", label: "Cinematic", filter: "contrast(1.2) saturate(0.85) brightness(0.95) sepia(0.06)" },
  { id: "vibrant", label: "Vibrant", filter: "saturate(1.5) contrast(1.1) brightness(1.02)" },
  { id: "mono", label: "Mono", filter: "grayscale(1) contrast(1.1)" },
];

export function getColorGradeFilter(presetId: string | null | undefined): string {
  return COLOR_GRADE_PRESETS.find((p) => p.id === presetId)?.filter ?? "none";
}
