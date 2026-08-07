// Curated scene presets for the "Magic Backdrop" flow — turns
// lib/youcam/textToImage.ts (previously only used server-side by
// scripts/seed-reference-models.ts) into a user-facing backdrop generator,
// scoped to product-photography scenes rather than open-ended image
// generation. Each preset is a full base prompt; the user's own text is
// appended as extra detail rather than replacing it, so a first-time user
// gets a usable result even with zero prompt-writing experience.
export type BackdropPreset = {
  id: string;
  label: string;
  prompt: string;
};

export const BACKDROP_PRESETS: BackdropPreset[] = [
  {
    id: "studio_white",
    label: "Studio white",
    prompt: "a seamless white studio backdrop with soft, even lighting, professional product photography",
  },
  {
    id: "runway",
    label: "Runway",
    prompt: "a fashion runway with dramatic spotlighting and a blurred audience in the background",
  },
  {
    id: "editorial",
    label: "Editorial",
    prompt: "a high-fashion editorial photoshoot set, moody dramatic lighting, magazine-quality backdrop",
  },
  {
    id: "street",
    label: "Street style",
    prompt: "an urban street style background, natural daylight, candid city fashion photography",
  },
  {
    id: "golden_hour",
    label: "Golden hour",
    prompt: "an outdoor scene at golden hour, warm sunset lighting, soft bokeh in the background",
  },
];

export function buildBackdropPrompt(presetId: string, extra: string): string {
  const preset = BACKDROP_PRESETS.find((p) => p.id === presetId);
  const base = preset?.prompt ?? "a clean, neutral product photography backdrop";
  return extra.trim() ? `${base}, ${extra.trim()}` : base;
}
