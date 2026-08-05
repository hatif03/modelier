/**
 * Generates the fictional streetwear-brand product photos used to populate
 * the demo account — synthetic flat-lay garment photos via YouCam
 * text-to-image (never a real brand's product, same "never real IP"
 * standard as scripts/seed-reference-models.ts), saved locally so they can
 * be fed into the app through the real Apparel VTO upload flow rather than
 * written directly to the database.
 *
 * Cost: 2 units (1 unit text-to-image x 2 photos).
 * Run: npx tsx scripts/generate-demo-product-photos.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { writeFileSync } from "fs";
import { join } from "path";

import { pollTaskUntilDone } from "../lib/youcam/client";
import { createTextToImageTask, type TextToImageResult } from "../lib/youcam/textToImage";

const OUT_DIR = join(__dirname, "..", ".scratch-tests");

const NEGATIVE = "real brand, logo, trademark, text, watermark, person, mannequin, blurry, low quality";

const PRODUCTS = [
  {
    file: "product-hoodie.png",
    prompt:
      "Product flat-lay photo of a plain oversized black streetwear hoodie, no logos or text, laid flat on a clean light gray studio background, soft even lighting, photorealistic, e-commerce product photography",
  },
  {
    file: "product-tee.png",
    prompt:
      "Product flat-lay photo of a plain oversized off-white cotton streetwear t-shirt, no logos or text, laid flat on a clean light gray studio background, soft even lighting, photorealistic, e-commerce product photography",
  },
];

async function main() {
  if (!process.env.YOUCAM_API_KEY) throw new Error("YOUCAM_API_KEY is not set");

  for (const product of PRODUCTS) {
    console.log(`Generating ${product.file}…`);
    const taskId = await createTextToImageTask({
      prompt: product.prompt,
      negativePrompt: NEGATIVE,
      size: "1328*1328",
    });
    const done = await pollTaskUntilDone<TextToImageResult>("text-to-image/youcam", taskId, { timeoutMs: 120000 });
    if (done.status !== "success" || !done.results?.url) {
      throw new Error(done.errorMessage ?? done.error ?? `Text-to-image failed for ${product.file}`);
    }

    const imageRes = await fetch(done.results.url);
    if (!imageRes.ok) throw new Error(`Failed to download generated image (${imageRes.status})`);
    const buffer = Buffer.from(await imageRes.arrayBuffer());

    const outPath = join(OUT_DIR, product.file);
    writeFileSync(outPath, new Uint8Array(buffer));
    console.log(`  saved -> ${outPath}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
