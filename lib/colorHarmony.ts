// Deterministic, local color-harmony scoring — the real Skin Tone Analysis API
// call already happened once per ReferenceModel at seed time
// (scripts/seed-reference-models.ts); that's where the genuine skin-AI ↔
// apparel-VTO fusion lives. Comparing a garment's color against an
// already-known undertone here is cheap, keeps generation latency inside
// budget, and burns zero extra YouCam units per variant.
import sharp from "sharp";

export type Undertone = "warm" | "cool" | "neutral";

// Downsamples to a small grid and buckets pixels into coarse RGB bins — a
// lightweight stand-in for full color quantization, good enough to find a
// garment photo's dominant hue without an extra native dependency.
//
// Two corrections for the common "flat-lay/mannequin on a plain backdrop"
// shape of these photos, or the naive version just confidently reports the
// studio background as the garment's color: (1) crop to the center region,
// since product/mannequin photos are near-universally centered with the
// background filling the edges; (2) within that crop, ignore near-white/
// near-black/low-saturation pixels (typical seamless-backdrop colors) unless
// they're ALL there is.
export async function extractDominantColor(buffer: Buffer): Promise<{ hex: string; hue: number }> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 512;
  const height = metadata.height ?? 512;

  const cropWidth = Math.round(width * 0.6);
  const cropHeight = Math.round(height * 0.7);

  const { data, info } = await sharp(buffer)
    .extract({
      left: Math.round((width - cropWidth) / 2),
      top: Math.round((height - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight,
    })
    .resize(32, 32, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  const backdropBuckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const target = isLikelyBackdrop(r, g, b) ? backdropBuckets : buckets;
    const existing = target.get(key);
    if (existing) existing.count++;
    else target.set(key, { count: 1, r, g, b });
  }

  const pool = buckets.size > 0 ? buckets : backdropBuckets;
  let best = { count: 0, r: 255, g: 255, b: 255 };
  for (const bucket of pool.values()) {
    if (bucket.count > best.count) best = bucket;
  }

  return { hex: rgbToHex(best.r, best.g, best.b), hue: rgbToHue(best.r, best.g, best.b) };
}

// Near-white, near-black, or low-saturation (grey) — the seamless studio
// backdrop colors that dominate these photos' edges/corners even after
// center-cropping.
function isLikelyBackdrop(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;
  const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  return lightness > 0.85 || lightness < 0.1 || saturation < 0.12;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  if (delta === 0) return 0;

  let hue: number;
  if (max === rn) hue = ((gn - bn) / delta) % 6;
  else if (max === gn) hue = (bn - rn) / delta + 2;
  else hue = (rn - gn) / delta + 4;

  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

export function hexToHue(hex: string): number {
  const clean = hex.replace("#", "");
  return rgbToHue(parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16));
}

// Warm band: red/orange/yellow and magenta-red. Cool band: green/cyan/blue.
// Everything else is a transitional/neutral band.
export function classifyHueTemperature(hue: number): Undertone {
  if ((hue >= 0 && hue <= 50) || hue >= 320) return "warm";
  if (hue >= 100 && hue <= 260) return "cool";
  return "neutral";
}

const HUE_NAMES: { max: number; name: string }[] = [
  { max: 15, name: "red" },
  { max: 45, name: "terracotta" },
  { max: 65, name: "gold" },
  { max: 90, name: "olive" },
  { max: 160, name: "green" },
  { max: 200, name: "teal" },
  { max: 250, name: "blue" },
  { max: 290, name: "violet" },
  { max: 330, name: "magenta" },
  { max: 361, name: "red" },
];

export function hueToColorName(hue: number): string {
  for (const band of HUE_NAMES) {
    if (hue <= band.max) return band.name;
  }
  return "neutral";
}

// Metal-tone classification for jewelry product photos, feeding the same
// warm/cool-undertone fusion the apparel flow already does with garment color — this is
// the real jewelry-styling convention (warm undertones read best in gold/rose-gold,
// cool undertones in silver/platinum). Reuses extractDominantColor unchanged; only the
// bucketing below is jewelry-specific.
export type MetalTone = "gold" | "rose_gold" | "silver" | "neutral";

export function classifyMetalTone(hex: string): MetalTone {
  const hue = hexToHue(hex);
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = (max + min) / 2;
  const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(max + min - 1));

  if (saturation < 0.15) return lightness > 0.55 ? "silver" : "neutral";
  if (hue >= 0 && hue <= 25) return saturation < 0.45 ? "rose_gold" : "gold";
  if (hue > 25 && hue <= 65) return "gold";
  return "neutral";
}

export type HarmonyResult = { score: number; note: string };

// Mirrors computeHarmonyScore's exact score/note shape for the jewelry flow — gold and
// rose-gold pair best with warm undertones, silver with cool undertones; a neutral
// metal tone or undertone is a safe, versatile pairing either way.
export function computeJewelryHarmonyScore(
  metalTone: MetalTone,
  model: { label: string; undertone: Undertone }
): HarmonyResult {
  const metalLabel = metalTone === "rose_gold" ? "rose gold" : metalTone;

  if (metalTone === "neutral" || model.undertone === "neutral") {
    return {
      score: 72,
      note: `This ${metalLabel} piece reads fairly neutral against ${model.label}'s ${model.undertone} undertone — a safe, versatile pairing.`,
    };
  }

  const metalTemp: Undertone = metalTone === "silver" ? "cool" : "warm";

  if (metalTemp === model.undertone) {
    return {
      score: 90,
      note: `This ${metalLabel} piece pairs strongly with ${model.label}'s ${model.undertone} undertone — ${metalTone === "silver" ? "silver tends to suit cool undertones" : "gold tones tend to suit warm undertones"}.`,
    };
  }

  return {
    score: 45,
    note: `This ${metalLabel} piece runs ${metalTemp} against ${model.label}'s ${model.undertone} undertone — a bolder, higher-contrast pairing.`,
  };
}

export function computeHarmonyScore(
  garmentHex: string,
  model: { label: string; undertone: Undertone }
): HarmonyResult {
  const garmentHue = hexToHue(garmentHex);
  const garmentTemp = classifyHueTemperature(garmentHue);
  const colorName = hueToColorName(garmentHue);

  let score: number;
  let note: string;

  if (garmentTemp === model.undertone) {
    score = 90;
    note = `This ${colorName} piece pairs strongly with ${model.label}'s ${model.undertone} undertone — both sit on the ${model.undertone} side of the color wheel.`;
  } else if (garmentTemp === "neutral" || model.undertone === "neutral") {
    score = 72;
    note = `This ${colorName} piece reads fairly neutral against ${model.label}'s ${model.undertone} undertone — a safe, versatile pairing.`;
  } else {
    score = 45;
    note = `This ${colorName} piece runs ${garmentTemp} against ${model.label}'s ${model.undertone} undertone — a bolder, higher-contrast pairing.`;
  }

  return { score, note };
}
