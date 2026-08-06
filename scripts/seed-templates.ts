/**
 * Seeds the Template table with starter layouts across the Dashboard's full
 * format catalog (lib/formats.ts), each carrying a tagged placeholder region
 * an AI Model Studio variant can be dropped into (see lib/templates.ts) and
 * copy actually relevant to a small fashion/beauty seller.
 *
 * canvasJson here is plain fabric.js object JSON — the same shape
 * fabric.util.enlivenObjects() reconstructs directly, not real fabric.Object
 * instances (this is a Node script; fabric needs a DOM/canvas context this
 * project doesn't set up server-side). Only "rect" and "text" types are used
 * — "i-text" crashes on serialization (see lib/colorHarmony.ts-adjacent notes
 * from earlier this session; fabric.IText's toObject() needs internal
 * text-layout state that isn't populated immediately after enlivening).
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

const INK = "#211C19";

function placeholder(left: number, top: number, width: number, height: number) {
  return { type: "rect", left, top, width, height, ...PLACEHOLDER_STYLE };
}

function text(value: string, left: number, top: number, fontSize: number, fill = INK) {
  // styles: {} (not omitted) — fabric.Text's own toObject() indexes into
  // `this.styles` by line number with no undefined-guard; a freshly
  // reconstructed Text whose source JSON omitted `styles` entirely ends up
  // with `this.styles === undefined`, and serializing it later (which
  // every syncShapeInStorage call does) throws.
  return { type: "text", text: value, left, top, fontSize, fontFamily: "Georgia", fill, styles: {} };
}

const TEMPLATES = [
  {
    id: "tpl-ig-post",
    name: "Instagram Post — Product Spotlight",
    format: "instagram_post",
    category: "apparel",
    thumbnailUrl: "#F1DCD2",
    canvasJson: [placeholder(40, 40, 420, 340), text("NEW ARRIVAL", 40, 400, 22)],
  },
  {
    id: "tpl-ig-post-sale",
    name: "Instagram Post — Sale Announcement",
    format: "instagram_post",
    category: "apparel",
    thumbnailUrl: "#BF6E52",
    canvasJson: [
      text("SALE", 40, 30, 40, "#BF6E52"),
      text("20% OFF EVERYTHING", 40, 85, 18),
      placeholder(40, 130, 420, 330),
    ],
  },
  {
    id: "tpl-ig-story",
    name: "Instagram Story — Look of the Day",
    format: "instagram_story",
    category: "apparel",
    thumbnailUrl: "#EDE4D7",
    canvasJson: [placeholder(30, 30, 340, 560), text("LOOK OF THE DAY", 30, 610, 20)],
  },
  {
    id: "tpl-ig-story-bts",
    name: "Instagram Story — Behind the Scenes",
    format: "instagram_story",
    category: "general",
    thumbnailUrl: "#E2D9CC",
    canvasJson: [text("BEHIND THE SCENES", 30, 40, 18), placeholder(30, 120, 340, 560)],
  },
  {
    id: "tpl-pinterest-pin",
    name: "Pinterest Pin — Shop the Look",
    format: "pinterest_pin",
    category: "apparel",
    thumbnailUrl: "#F1DCD2",
    canvasJson: [placeholder(30, 30, 340, 480), text("SHOP THE LOOK", 30, 530, 20)],
  },
  {
    id: "tpl-facebook-post",
    name: "Facebook Post — New Collection",
    format: "facebook_post",
    category: "apparel",
    thumbnailUrl: "#EDE4D7",
    canvasJson: [placeholder(30, 30, 300, 255), text("NEW COLLECTION", 360, 120, 22), text("Shop now", 360, 160, 14)],
  },
  {
    id: "tpl-listing",
    name: "Product Listing — Clean Square",
    format: "product_listing",
    category: "general",
    thumbnailUrl: "#E2D9CC",
    canvasJson: [placeholder(40, 40, 350, 350), text("$0.00", 40, 410, 20)],
  },
  {
    id: "tpl-etsy-banner",
    name: "Shop Banner — Boutique Banner",
    format: "etsy_banner",
    category: "general",
    thumbnailUrl: "#F1DCD2",
    canvasJson: [
      text("YOUR SHOP NAME", 40, 45, 26),
      text("Handmade with love", 40, 90, 13),
      placeholder(480, 25, 100, 100),
    ],
  },
  {
    id: "tpl-email-header",
    name: "Email Header — Newsletter Banner",
    format: "email_header",
    category: "general",
    thumbnailUrl: "#EDE4D7",
    canvasJson: [text("YOUR BRAND", 40, 60, 28), text("New arrivals, every week", 40, 110, 13), placeholder(480, 50, 80, 80)],
  },
  {
    id: "tpl-flyer",
    name: "Flyer — Seasonal Sale",
    format: "flyer",
    category: "apparel",
    thumbnailUrl: "#F1DCD2",
    canvasJson: [
      placeholder(30, 30, 340, 300),
      text("SEASONAL SALE", 30, 350, 24),
      text("Up to 40% off", 30, 390, 15),
    ],
  },
  {
    id: "tpl-business-card",
    name: "Business Card — Minimal",
    format: "business_card",
    category: "general",
    thumbnailUrl: "#E2D9CC",
    canvasJson: [
      text("Your Name", 30, 60, 20),
      text("Founder, Your Brand", 30, 90, 12),
      text("hello@yourbrand.com", 30, 130, 11),
    ],
  },
  {
    id: "tpl-thank-you",
    name: "Thank-You Card — Order Thank-You",
    format: "thank_you_card",
    category: "general",
    thumbnailUrl: "#F1DCD2",
    canvasJson: [placeholder(50, 40, 200, 200), text("THANK YOU", 50, 260, 22), text("FOR YOUR ORDER", 50, 295, 15)],
  },
  {
    id: "tpl-ig-post-jewelry",
    name: "Instagram Post — Jewelry Spotlight",
    format: "instagram_post",
    category: "jewelry",
    thumbnailUrl: "#EDE4D7",
    canvasJson: [placeholder(60, 60, 380, 300), text("NEW ARRIVAL", 60, 380, 22)],
  },
  {
    id: "tpl-pinterest-pin-gift-guide",
    name: "Pinterest Pin — Gift Guide",
    format: "pinterest_pin",
    category: "jewelry",
    thumbnailUrl: "#F1DCD2",
    canvasJson: [text("GIFT GUIDE", 30, 30, 24, "#BF6E52"), placeholder(30, 80, 340, 430), text("Shop the edit", 30, 530, 15)],
  },
  {
    id: "tpl-listing-jewelry-macro",
    name: "Product Listing — Jewelry Macro",
    format: "product_listing",
    category: "jewelry",
    thumbnailUrl: "#E2D9CC",
    // Tighter, more centered square than tpl-listing — jewelry product photos are
    // near-square macro shots (ring/earring close-ups), not full garment flat-lays.
    canvasJson: [placeholder(75, 75, 300, 300), text("$0.00", 75, 400, 20)],
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
  console.log(`\nTemplate seed complete (${TEMPLATES.length} templates).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
