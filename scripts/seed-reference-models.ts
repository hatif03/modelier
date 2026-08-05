/**
 * Generates fully synthetic reference model images via YouCam text-to-image
 * (never a real person's photo — the PRD's hard requirement), analyzes real
 * skin tone once per model via YouCam's Skin Tone Analysis, re-hosts the image
 * on Supabase Storage for a stable URL, uploads it to YouCam's File API for
 * reuse across every future VTO call, and upserts ReferenceModel rows.
 *
 * One-time cost: 4 profiles x (1 unit text-to-image + 20 units skin-tone-analysis) = 84 units.
 *
 * Requires DATABASE_URL, YOUCAM_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE.
 * Run: npm run db:seed-reference-models
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

import { pollTaskUntilDone, uploadFile } from "../lib/youcam/client";
import { createSkinToneAnalysisTask, type SkinToneAnalysisResult } from "../lib/youcam/skinToneAnalysis";
import { createTextToImageTask, type TextToImageResult } from "../lib/youcam/textToImage";
import { classifyHueTemperature, hexToHue } from "../lib/colorHarmony";
import { ensurePublicBucket, uploadPublicFile } from "../lib/storage";

const FEATURE_T2I = "text-to-image/youcam";
const FEATURE_SKIN = "skin-tone-analysis";

type Preset = {
  id: string;
  label: string;
  bodyType: "slim" | "athletic" | "curvy" | "plus";
  prompt: string;
};

const PRESETS: Preset[] = [
  {
    id: "cm0refmodel000000000000001",
    label: "Model A — fair, slim",
    bodyType: "slim",
    prompt:
      "Full-body fashion reference photo of a fictional synthetic woman, slim build, fair skin, neutral studio backdrop, facing camera, wearing simple neutral undergarments, no logos, photorealistic, no celebrity likeness",
  },
  {
    id: "cm0refmodel000000000000002",
    label: "Model B — medium olive, athletic",
    bodyType: "athletic",
    prompt:
      "Full-body fashion reference photo of a fictional synthetic woman, athletic build, medium olive skin, neutral studio backdrop, facing camera, wearing simple neutral undergarments, no logos, photorealistic, no celebrity likeness",
  },
  {
    id: "cm0refmodel000000000000003",
    label: "Model C — deep warm, curvy",
    bodyType: "curvy",
    prompt:
      "Full-body fashion reference photo of a fictional synthetic woman, curvy build, deep warm brown skin, neutral studio backdrop, facing camera, wearing simple neutral undergarments, no logos, photorealistic, no celebrity likeness",
  },
  {
    id: "cm0refmodel000000000000004",
    label: "Model D — rich neutral, plus",
    bodyType: "plus",
    prompt:
      "Full-body fashion reference photo of a fictional synthetic woman, plus-size build, rich neutral brown skin, neutral studio backdrop, facing camera, wearing simple neutral undergarments, no logos, photorealistic, no celebrity likeness",
  },
];

const NEGATIVE = "real person, celebrity, trademark, text, watermark, distorted anatomy, extra limbs, blurry";

async function generateImageUrl(prompt: string): Promise<string> {
  const taskId = await createTextToImageTask({ prompt, negativePrompt: NEGATIVE, size: "1104*1472" });
  const done = await pollTaskUntilDone<TextToImageResult>(FEATURE_T2I, taskId, { timeoutMs: 120000 });
  if (done.status !== "success" || !done.results?.url) {
    throw new Error(done.errorMessage ?? done.error ?? "Text-to-image failed");
  }
  return done.results.url;
}

async function analyzeSkinTone(srcFileUrl: string): Promise<string> {
  // Full-body generations don't frame the face as tightly/frontally as a
  // selfie — "flexible" (<=30 degrees pitch/yaw/roll) avoids rejecting
  // otherwise-usable images over face angle alone.
  const taskId = await createSkinToneAnalysisTask({ srcFileUrl, faceAngleStrictnessLevel: "flexible" });
  const done = await pollTaskUntilDone<SkinToneAnalysisResult>(FEATURE_SKIN, taskId, { timeoutMs: 120000 });
  if (done.status !== "success") {
    throw new Error(done.errorMessage ?? done.error ?? "Skin tone analysis failed");
  }
  const hex = done.results?.color?.skin_color;
  if (!hex) throw new Error("Skin tone analysis returned no skin_color");
  return hex.startsWith("#") ? hex : `#${hex}`;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.YOUCAM_API_KEY) throw new Error("YOUCAM_API_KEY is not set");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    throw new Error("Supabase Storage env vars are not set");
  }

  await ensurePublicBucket();

  const db = new PrismaClient();

  // Optional: pass one or more preset IDs as argv to retry just those (e.g.
  // after a single profile's generation failed a content check) without
  // re-spending units re-seeding the ones that already succeeded.
  const requestedIds = process.argv.slice(2);
  const presets = requestedIds.length > 0 ? PRESETS.filter((p) => requestedIds.includes(p.id)) : PRESETS;

  for (const preset of presets) {
    console.log(`\nSeeding ${preset.label} (${preset.id})…`);

    // YouCam's generated-image URL is only valid for a couple of hours — do
    // everything that needs it (skin analysis, downloading the bytes) before
    // it expires, then re-host permanently ourselves.
    const tempImageUrl = await generateImageUrl(preset.prompt);
    const skinToneHex = await analyzeSkinTone(tempImageUrl);

    const imageRes = await fetch(tempImageUrl);
    if (!imageRes.ok) throw new Error(`Failed to download generated image (${imageRes.status})`);
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const contentType = imageRes.headers.get("content-type") ?? "image/png";

    const [{ fileId: youcamFileId }, imageUrl] = await Promise.all([
      uploadFile(buffer, { contentType, fileName: `${preset.id}.png` }),
      uploadPublicFile(`reference-models/${preset.id}.png`, buffer, contentType),
    ]);

    // Same hue-based classification used against garment colors in
    // lib/colorHarmony.ts, so "warm garment" vs. "warm undertone" compares
    // apples to apples.
    const undertone = classifyHueTemperature(hexToHue(skinToneHex));

    await db.referenceModel.upsert({
      where: { id: preset.id },
      create: {
        id: preset.id,
        label: preset.label,
        bodyType: preset.bodyType,
        skinToneHex,
        undertone,
        youcamFileId,
        imageUrl,
        isActive: true,
      },
      update: {
        label: preset.label,
        bodyType: preset.bodyType,
        skinToneHex,
        undertone,
        youcamFileId,
        imageUrl,
        isActive: true,
      },
    });

    console.log(`  imageUrl: ${imageUrl}`);
    console.log(`  skinToneHex: ${skinToneHex}, undertone: ${undertone}, youcamFileId: ${youcamFileId}`);
  }

  await db.$disconnect();
  console.log("\nReference model seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
