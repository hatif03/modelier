/**
 * Seeds the Template table with starter layouts (Instagram post/story,
 * product listing), each carrying one tagged placeholder region a generated
 * AI Model Studio variant can be dropped into (see lib/templates.ts).
 *
 * canvasJson here is plain fabric.js object JSON — the same shape
 * fabric.util.enlivenObjects() reconstructs directly, not real fabric.Object
 * instances (this is a Node script; fabric needs a DOM/canvas context this
 * project doesn't set up server-side).
 *
 * Run: npm run db:seed-templates
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";

const PLACEHOLDER_STYLE = {
  fill: "#F1DCD2",
  stroke: "#BF6E52",
  strokeWidth: 1,
  strokeDashArray: [8, 6],
  isPlaceholder: true,
  placeholderId: "hero",
};

const TEMPLATES = [
  {
    id: "tpl-ig-post",
    name: "Instagram Post — Product Spotlight",
    format: "instagram_post",
    category: "apparel",
    thumbnailUrl: "#F1DCD2",
    canvasJson: [
      { type: "rect", left: 40, top: 40, width: 400, height: 400, ...PLACEHOLDER_STYLE },
      { type: "text", text: "NEW ARRIVAL", left: 40, top: 460, fontSize: 22, fontFamily: "Georgia", fill: "#211C19" },
    ],
  },
  {
    id: "tpl-ig-story",
    name: "Instagram Story — Look of the Day",
    format: "instagram_story",
    category: "apparel",
    thumbnailUrl: "#EDE4D7",
    canvasJson: [
      { type: "rect", left: 40, top: 40, width: 300, height: 500, ...PLACEHOLDER_STYLE },
      { type: "text", text: "LOOK OF THE DAY", left: 40, top: 560, fontSize: 18, fontFamily: "Georgia", fill: "#211C19" },
    ],
  },
  {
    id: "tpl-listing",
    name: "Product Listing — Clean Square",
    format: "product_listing",
    category: "general",
    thumbnailUrl: "#E2D9CC",
    canvasJson: [
      { type: "rect", left: 40, top: 40, width: 350, height: 350, ...PLACEHOLDER_STYLE },
      { type: "text", text: "$0.00", left: 40, top: 410, fontSize: 20, fontFamily: "Georgia", fill: "#211C19" },
    ],
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const db = new PrismaClient();

  for (const t of TEMPLATES) {
    await db.template.upsert({
      where: { id: t.id },
      create: { ...t, isSystem: true },
      update: { ...t, isSystem: true },
    });
    console.log(`Seeded ${t.name}`);
  }

  await db.$disconnect();
  console.log("\nTemplate seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
