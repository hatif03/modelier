/**
 * Seeds close-up hand/wrist pose photos for each existing ReferenceModel, needed for
 * jewelry VTO categories the full-body shot can't frame tightly enough (ring needs a
 * hand close-up; bracelet/watch need a wrist close-up). Necklace/earring reuse the
 * existing full-body shot directly and get no pose row here — see POSE_BY_CATEGORY in
 * lib/youcam/jewelryVto.ts.
 *
 * IMPORTANT LIMITATION: this generates a FRESH text-to-image render per pose, reusing
 * only the parent model's skin-tone *description* in the prompt. AI image generation
 * has no cross-generation identity-consistency guarantee — this is NOT a verified
 * pixel-identical match to the original face/body, just the same described skin tone.
 * Label these in the UI as e.g. "Model A — hand close-up," not as a guaranteed
 * continuation of the same synthetic person.
 *
 * No new skin-tone-analysis call is made — the parent ReferenceModel's already-detected
 * undertone/skinToneHex is reused as-is for jewelry metal-tone harmony scoring.
 *
 * Run: npm run db:seed-reference-model-poses (after db:seed-reference-models)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

import { uploadFile } from "../lib/youcam/client";
import { createTextToImageTask, type TextToImageResult } from "../lib/youcam/textToImage";
import { pollTaskUntilDone } from "../lib/youcam/client";
import { ensurePublicBucket, uploadPublicFile } from "../lib/storage";

const FEATURE_T2I = "text-to-image/youcam";

type PoseType = "hand" | "wrist";

type SkinDescriptor = { bodyType: string; descriptor: string };

// Mirrors scripts/seed-reference-models.ts's PRESETS skin descriptors — kept as a
// separate small map here (rather than re-deriving from skinToneHex) so the close-up
// prompt reads naturally, the same way the original full-body prompts did.
const SKIN_DESCRIPTORS: Record<string, SkinDescriptor> = {
  cm0refmodel000000000000001: { bodyType: "slim", descriptor: "fair skin" },
  cm0refmodel000000000000002: { bodyType: "athletic", descriptor: "medium olive skin" },
  cm0refmodel000000000000003: { bodyType: "curvy", descriptor: "deep warm brown skin" },
  cm0refmodel000000000000004: { bodyType: "plus", descriptor: "rich neutral brown skin" },
};

const NEGATIVE = "real person, celebrity, trademark, text, watermark, distorted anatomy, extra fingers, jewelry, rings, bracelets, blurry";

function promptFor(pose: PoseType, descriptor: string): string {
  return pose === "hand"
    ? `Close-up product photo of a fictional synthetic woman's hand and fingers, ${descriptor}, palm and fingers clearly visible, resting on a neutral studio surface, no rings, no nail polish, photorealistic, no celebrity likeness`
    : `Close-up product photo of a fictional synthetic woman's wrist and forearm, ${descriptor}, wrist clearly visible against a neutral studio backdrop, no bracelets, no watch, photorealistic, no celebrity likeness`;
}

async function generateImageUrl(prompt: string): Promise<string> {
  const taskId = await createTextToImageTask({ prompt, negativePrompt: NEGATIVE, size: "1104*1472" });
  const done = await pollTaskUntilDone<TextToImageResult>(FEATURE_T2I, taskId, { timeoutMs: 120000 });
  if (done.status !== "success" || !done.results?.url) {
    throw new Error(done.errorMessage ?? done.error ?? "Text-to-image failed");
  }
  return done.results.url;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!process.env.YOUCAM_API_KEY) throw new Error("YOUCAM_API_KEY is not set");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    throw new Error("Supabase Storage env vars are not set");
  }

  await ensurePublicBucket();

  const db = new PrismaClient();

  const models = await db.referenceModel.findMany({ where: { isActive: true } });
  if (models.length === 0) {
    throw new Error("No active ReferenceModel rows found — run db:seed-reference-models first.");
  }

  const poses: PoseType[] = ["hand", "wrist"];

  for (const model of models) {
    const skin = SKIN_DESCRIPTORS[model.id];
    if (!skin) {
      console.warn(`No skin descriptor mapped for ${model.id} (${model.label}) — skipping.`);
      continue;
    }

    for (const pose of poses) {
      console.log(`\nSeeding ${pose} pose for ${model.label} (${model.id})…`);

      const tempImageUrl = await generateImageUrl(promptFor(pose, skin.descriptor));

      const imageRes = await fetch(tempImageUrl);
      if (!imageRes.ok) throw new Error(`Failed to download generated image (${imageRes.status})`);
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      const contentType = imageRes.headers.get("content-type") ?? "image/png";

      const [{ fileId: youcamFileId }, imageUrl] = await Promise.all([
        uploadFile(buffer, { contentType, fileName: `${model.id}-${pose}.png` }),
        uploadPublicFile(`reference-model-poses/${model.id}-${pose}.png`, buffer, contentType),
      ]);

      await db.referenceModelPose.upsert({
        where: { referenceModelId_pose: { referenceModelId: model.id, pose } },
        create: { referenceModelId: model.id, pose, youcamFileId, imageUrl },
        update: { youcamFileId, imageUrl },
      });

      console.log(`  imageUrl: ${imageUrl}`);
    }
  }

  await db.$disconnect();
  console.log("\nReference model pose seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
