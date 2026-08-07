// Single source of truth for every "single photo, one effect" AI Studio flow
// (skin/face/body retouch + analysis) — one data-driven registry instead of
// 14 hand-built parameter forms. AIModelStudioPanel renders a generic form
// from `controls`, and app/api/generations/route.ts's effectId dispatches
// into lib/youcam/effectDispatch.ts, which has the matching wrapper calls.
export type EffectSliderControl = {
  type: "slider";
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Divide the raw slider value by this before sending (e.g. a 0–100 slider for a 0–1 API param). */
  scale?: number;
};

export type EffectSelectControl = {
  type: "select";
  key: string;
  label: string;
  options: { value: string; label: string }[];
  default: string;
};

// A required, curated-swatch choice (hairstyle/beard/fabric-print packs) —
// options are fetched live from /api/effect-templates?feature=<feature>
// (a thin wrapper over YouCam's own template packs) rather than hard-coded,
// since the packs are managed on PerfectCorp's side and can change. Unlike
// slider/select controls this has no `default` — nothing is applied until
// the user picks a swatch, so isEffectReady() below gates Generate on it.
export type EffectTemplateControl = {
  type: "template";
  key: string;
  label: string;
  feature: string;
};

export type EffectControl = EffectSliderControl | EffectSelectControl | EffectTemplateControl;

export type EffectCategory = "retouch" | "body" | "analysis" | "hair" | "accessories" | "nails";

export type EffectDefinition = {
  id: string;
  category: EffectCategory;
  label: string;
  /** Shown under the effect name — sets expectations before a first-time user hits Generate. */
  description: string;
  kind: "image" | "data";
  controls: EffectControl[];
  /** Set when the effect needs a second photo alongside the main source photo — a face to swap in, a lens-color swatch, a makeup look to copy. */
  refPhotoLabel?: string;
};

export const EFFECT_CATEGORIES: { id: EffectCategory; label: string }[] = [
  { id: "retouch", label: "Portrait Retouch" },
  { id: "body", label: "Body" },
  { id: "hair", label: "Hair & Beard" },
  { id: "accessories", label: "Accessories" },
  { id: "nails", label: "Nails" },
  { id: "analysis", label: "Skin & Face Analysis" },
];

// Mirrors lib/youcam/fashionAccessories.ts's STYLE_ACCESSORY_PRESETS — duplicated
// rather than imported for the same reason as DATA_FEATURE_SLUGS below (this
// client-facing module never pulls in server-only YouCam wrapper files).
const ACCESSORY_STYLE_OPTIONS: Record<"shoes" | "hat" | "bag" | "scarf", { value: string; label: string }[]> = {
  shoes: [
    { value: "classic", label: "Classic" },
    { value: "sporty", label: "Sporty" },
    { value: "elegant", label: "Elegant" },
    { value: "streetwear", label: "Streetwear" },
    { value: "minimalist", label: "Minimalist" },
    { value: "random", label: "Surprise me" },
  ],
  scarf: [
    { value: "french_elegance", label: "French elegance" },
    { value: "light_luxury", label: "Light luxury" },
    { value: "cottagecore", label: "Cottagecore" },
    { value: "modern_chic", label: "Modern chic" },
    { value: "bohemian", label: "Bohemian" },
    { value: "random", label: "Surprise me" },
  ],
  bag: [
    { value: "parisian_chic", label: "Parisian chic" },
    { value: "urban_chic", label: "Urban chic" },
    { value: "mediterranean_chic", label: "Mediterranean chic" },
    { value: "art_deco_style", label: "Art deco" },
    { value: "random", label: "Surprise me" },
  ],
  hat: [{ value: "random", label: "Surprise me" }],
};

export const EFFECTS: EffectDefinition[] = [
  {
    id: "skin_simulation",
    category: "retouch",
    label: "Skin Retouch",
    description: "Smooths texture, evens tone, and softens common skin concerns.",
    kind: "image",
    controls: [
      { type: "slider", key: "wrinkles", label: "Wrinkles", min: 0, max: 100, step: 5, default: 40, scale: 100 },
      { type: "slider", key: "spots", label: "Spots", min: 0, max: 100, step: 5, default: 40, scale: 100 },
      { type: "slider", key: "texture", label: "Texture", min: 0, max: 100, step: 5, default: 30, scale: 100 },
      { type: "slider", key: "radiance", label: "Radiance", min: 0, max: 100, step: 5, default: 30, scale: 100 },
      { type: "slider", key: "darkCircles", label: "Dark circles", min: 0, max: 100, step: 5, default: 30, scale: 100 },
      { type: "slider", key: "redness", label: "Redness", min: 0, max: 100, step: 5, default: 30, scale: 100 },
    ],
  },
  {
    id: "face_lift",
    category: "retouch",
    label: "Face Lift",
    description: "Subtly refines cheeks, forehead, mouth, and under-eye area.",
    kind: "image",
    controls: [
      { type: "slider", key: "cheeks", label: "Cheeks", min: 0, max: 100, step: 5, default: 20 },
      { type: "slider", key: "forehead", label: "Forehead", min: 0, max: 100, step: 5, default: 20 },
      { type: "slider", key: "eyeBags", label: "Eye bags", min: 0, max: 100, step: 5, default: 30 },
      { type: "slider", key: "mouth", label: "Mouth", min: 0, max: 100, step: 5, default: 15 },
    ],
  },
  {
    id: "face_reshape",
    category: "retouch",
    label: "Face Reshape",
    description: "Fine-tunes facial proportions — eyes, nose, lips, jawline.",
    kind: "image",
    controls: [
      { type: "slider", key: "eyes", label: "Eyes", min: -50, max: 50, step: 5, default: 10 },
      { type: "slider", key: "nose", label: "Nose", min: -50, max: 50, step: 5, default: 10 },
      { type: "slider", key: "lips", label: "Lips", min: -50, max: 50, step: 5, default: 5 },
      { type: "slider", key: "jaw", label: "Jawline", min: 0, max: 100, step: 5, default: 15 },
      { type: "slider", key: "cheekbones", label: "Cheekbones", min: 0, max: 100, step: 5, default: 15 },
    ],
  },
  {
    id: "aging_simulation",
    category: "retouch",
    label: "Aging Simulation",
    description: "Shows what this person might look like at an older age.",
    kind: "image",
    controls: [],
  },
  {
    id: "smile",
    category: "retouch",
    label: "AI Smile",
    description: "Adds a natural smile to a neutral-expression photo.",
    kind: "image",
    controls: [
      {
        type: "select",
        key: "style",
        label: "Style",
        default: "smile_with_teeth_visible",
        options: [
          { value: "smile_with_teeth_visible", label: "Teeth visible" },
          { value: "closed_mouth_smile", label: "Closed mouth" },
        ],
      },
    ],
  },
  {
    id: "teeth_whitening",
    category: "retouch",
    label: "Teeth Whitening",
    description: "Brightens teeth in a smiling photo.",
    kind: "image",
    controls: [{ type: "slider", key: "intensity", label: "Intensity", min: 0, max: 100, step: 5, default: 60, scale: 100 }],
  },
  {
    id: "hair_color",
    category: "retouch",
    label: "Hair Color",
    description: "Recolors hair using a preset shade.",
    kind: "image",
    controls: [
      {
        type: "select",
        key: "preset",
        label: "Shade",
        default: "natural_black",
        options: [
          { value: "natural_black", label: "Natural black" },
          { value: "chestnut_brown", label: "Chestnut brown" },
          { value: "honey_blonde", label: "Honey blonde" },
          { value: "copper_red", label: "Copper red" },
          { value: "ash_gray", label: "Ash gray" },
        ],
      },
    ],
  },
  {
    id: "face_swap",
    category: "retouch",
    label: "Face Swap",
    description: "Swaps in a different person's face from a second reference photo.",
    kind: "image",
    controls: [],
    refPhotoLabel: "Face to swap in",
  },
  {
    id: "makeup_transfer",
    category: "retouch",
    label: "Makeup Transfer",
    description: "Copies a full makeup look from a reference photo onto this one.",
    kind: "image",
    controls: [],
    refPhotoLabel: "Makeup look to copy",
  },
  {
    id: "body_reshape",
    category: "body",
    label: "Body Reshape",
    description: "Adjusts waist, hips, legs, and overall silhouette.",
    kind: "image",
    controls: [
      { type: "slider", key: "waist", label: "Waist", min: 0, max: 100, step: 5, default: 20 },
      { type: "slider", key: "belly", label: "Belly", min: 0, max: 100, step: 5, default: 20 },
      { type: "slider", key: "hip", label: "Hip", min: 0, max: 100, step: 5, default: 10 },
      { type: "slider", key: "leg", label: "Leg", min: 0, max: 100, step: 5, default: 10 },
      { type: "slider", key: "arm", label: "Arm", min: 0, max: 100, step: 5, default: 10 },
      { type: "slider", key: "slim", label: "Overall slim", min: 0, max: 100, step: 5, default: 15 },
    ],
  },
  {
    id: "breast_augmentation",
    category: "body",
    label: "Breast Augmentation",
    description: "Simulates a fuller silhouette at a chosen intensity.",
    kind: "image",
    controls: [
      {
        type: "select",
        key: "intensity",
        label: "Intensity",
        default: "2",
        options: [
          { value: "1", label: "Subtle" },
          { value: "2", label: "Moderate" },
          { value: "3", label: "Pronounced" },
        ],
      },
    ],
  },
  {
    id: "abs_filter",
    category: "body",
    label: "Abs Filter",
    description: "Adds definition to the midsection.",
    kind: "image",
    controls: [
      {
        type: "select",
        key: "mode",
        label: "Style",
        default: "Vest-line",
        options: [
          { value: "Vest-line", label: "Vest line" },
          { value: "Six-pack", label: "Six-pack" },
        ],
      },
      { type: "slider", key: "intensity", label: "Intensity", min: 0, max: 100, step: 5, default: 50, scale: 100 },
    ],
  },
  {
    id: "hairstyle",
    category: "hair",
    label: "Hairstyle",
    description: "Tries on a hairstyle from a curated template pack.",
    kind: "image",
    controls: [{ type: "template", key: "templateId", label: "Hairstyle", feature: "hair-transfer" }],
  },
  {
    id: "hair_extension",
    category: "hair",
    label: "Hair Extensions",
    description: "Adds length and volume from a curated template pack.",
    kind: "image",
    controls: [{ type: "template", key: "templateId", label: "Extension style", feature: "hair-ext" }],
  },
  {
    id: "hair_volume",
    category: "hair",
    label: "Hair Volume",
    description: "Adds fullness and body from a curated template pack.",
    kind: "image",
    controls: [{ type: "template", key: "templateId", label: "Volume style", feature: "hair-vol" }],
  },
  {
    id: "bangs",
    category: "hair",
    label: "Bangs",
    description: "Tries on a fringe/bangs style from a curated template pack.",
    kind: "image",
    controls: [{ type: "template", key: "templateId", label: "Bangs style", feature: "hair-bang" }],
  },
  {
    id: "wavy_hair",
    category: "hair",
    label: "Wavy Hair",
    description: "Adds curls or waves from a curated template pack.",
    kind: "image",
    controls: [{ type: "template", key: "templateId", label: "Wave style", feature: "hair-curl" }],
  },
  {
    id: "beard_style",
    category: "hair",
    label: "Beard Style",
    description: "Tries on a beard/facial hair style from a curated template pack.",
    kind: "image",
    controls: [{ type: "template", key: "templateId", label: "Beard style", feature: "beard-style" }],
  },
  {
    id: "fabric",
    category: "accessories",
    label: "Fabric Print",
    description: "Applies a fabric print from a curated template pack onto the garment.",
    kind: "image",
    controls: [{ type: "template", key: "templateId", label: "Print", feature: "fabric" }],
  },
  {
    id: "eye_color_lens",
    category: "accessories",
    label: "Eye Color Lens",
    description: "Tries on a contact-lens color from a second reference swatch photo.",
    kind: "image",
    controls: [],
    refPhotoLabel: "Lens color reference photo",
  },
  {
    id: "shoes",
    category: "accessories",
    label: "Shoes",
    description: "Tries on a pair of shoes in the chosen style.",
    kind: "image",
    controls: [
      { type: "select", key: "style", label: "Style", default: "random", options: ACCESSORY_STYLE_OPTIONS.shoes },
      {
        type: "select",
        key: "gender",
        label: "Fit",
        default: "female",
        options: [
          { value: "female", label: "Women's" },
          { value: "male", label: "Men's" },
        ],
      },
    ],
  },
  {
    id: "hat",
    category: "accessories",
    label: "Hat",
    description: "Tries on a hat.",
    kind: "image",
    controls: [{ type: "select", key: "style", label: "Style", default: "random", options: ACCESSORY_STYLE_OPTIONS.hat }],
  },
  {
    id: "bag",
    category: "accessories",
    label: "Bag",
    description: "Tries on a bag in the chosen style.",
    kind: "image",
    controls: [{ type: "select", key: "style", label: "Style", default: "random", options: ACCESSORY_STYLE_OPTIONS.bag }],
  },
  {
    id: "scarf",
    category: "accessories",
    label: "Scarf",
    description: "Tries on a scarf in the chosen style.",
    kind: "image",
    controls: [{ type: "select", key: "style", label: "Style", default: "random", options: ACCESSORY_STYLE_OPTIONS.scarf }],
  },
  {
    id: "nail_vto",
    category: "nails",
    label: "Nail Polish",
    description: "Applies a manicure look across all fingers.",
    kind: "image",
    controls: [
      {
        type: "select",
        key: "effectType",
        label: "Type",
        default: "nail_polish",
        options: [
          { value: "nail_polish", label: "Polish" },
          { value: "press_on_nails", label: "Press-on" },
        ],
      },
      { type: "slider", key: "reflection", label: "Shine", min: 0, max: 100, step: 5, default: 50, scale: 100 },
      { type: "slider", key: "shimmer", label: "Shimmer", min: 0, max: 100, step: 5, default: 0, scale: 100 },
      { type: "slider", key: "transparency", label: "Sheerness", min: 0, max: 100, step: 5, default: 20, scale: 100 },
      { type: "slider", key: "contrast", label: "Contrast", min: 0, max: 100, step: 5, default: 50, scale: 100 },
      { type: "slider", key: "roughness", label: "Matte-ness", min: 0, max: 100, step: 5, default: 30, scale: 100 },
    ],
  },
  {
    id: "skin_analysis",
    category: "analysis",
    label: "Skin Analysis",
    description: "Scores wrinkles, pores, texture, spots, and more — a report, not an edited photo.",
    kind: "data",
    controls: [],
  },
  {
    id: "face_analyzer",
    category: "analysis",
    label: "Face Analyzer",
    description: "Reads face shape, ratios, and feature metrics — a report, not an edited photo.",
    kind: "data",
    controls: [],
  },
  {
    id: "skin_tone_analysis",
    category: "analysis",
    label: "Skin Tone Analysis",
    description: "Detects skin, eye, hair, and lip color — a report, not an edited photo.",
    kind: "data",
    controls: [],
  },
  {
    id: "fitzpatrick_skin_type",
    category: "analysis",
    label: "Fitzpatrick Skin Type",
    description: "Classifies skin type on the Fitzpatrick I–VI scale — a report, not an edited photo.",
    kind: "data",
    controls: [],
  },
];

// Mirrors lib/youcam/effectDispatch.ts's DATA_FEATURE_SLUGS — duplicated
// rather than imported so this client-facing module never pulls in the
// server-only YouCam wrapper files just to check a feature string.
const DATA_FEATURE_SLUGS = new Set(["skin-analysis", "skin-tone-analysis", "fitzpatrick-scale-analyzer", "face-attr-analysis"]);

export function isDataFeatureSlug(feature: string): boolean {
  return DATA_FEATURE_SLUGS.has(feature);
}

export function getEffect(id: string): EffectDefinition | undefined {
  return EFFECTS.find((e) => e.id === id);
}

// Template controls have no `default` — nothing is pre-applied until the
// user picks a swatch (see EffectTemplateControl above), so they're left
// unset here rather than defaulted to undefined-as-a-string.
export function defaultParamsFor(effect: EffectDefinition): Record<string, number | string> {
  return Object.fromEntries(effect.controls.filter((c) => c.type !== "template").map((c) => [c.key, c.default]));
}

// Converts UI slider/select values into the units each wrapper function
// expects (e.g. a 0–100 "Wrinkles" slider becomes the API's 0–1 float).
export function paramsForSubmission(effect: EffectDefinition, values: Record<string, number | string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const control of effect.controls) {
    const value = values[control.key];
    if (value === undefined) continue;
    out[control.key] = control.type === "slider" && control.scale ? Number(value) / control.scale : value;
  }
  return out;
}

// Gates the Generate button — a template-pack effect isn't ready until a
// swatch is chosen, and a ref-photo effect isn't ready until that second
// photo is attached (neither is enforceable by the plain "is there a source
// file" check the rest of the effect flow uses).
export function isEffectReady(
  effect: EffectDefinition,
  values: Record<string, number | string>,
  hasRefPhoto: boolean
): boolean {
  if (effect.refPhotoLabel && !hasRefPhoto) return false;
  return effect.controls.every((c) => c.type !== "template" || Boolean(values[c.key]));
}
