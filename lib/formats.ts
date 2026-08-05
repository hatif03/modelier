// Shared by the Dashboard's quick-create tiles and scripts/seed-templates.ts.
// Dimensions stay in the same "design unit" scale the canvas already uses
// (~400-500px range) — real-world aspect ratio, scaled down, not actual
// social-platform pixel dimensions (no pixel-exact export requirement yet).
export type FormatId =
  | "instagram_post"
  | "instagram_story"
  | "pinterest_pin"
  | "facebook_post"
  | "product_listing"
  | "etsy_banner"
  | "email_header"
  | "flyer"
  | "business_card"
  | "thank_you_card";

export type Format = {
  id: FormatId;
  label: string;
  aspectLabel: string;
  width: number;
  height: number;
};

export const FORMATS: Format[] = [
  { id: "instagram_post", label: "Instagram Post", aspectLabel: "1:1", width: 500, height: 500 },
  { id: "instagram_story", label: "Instagram Story / Reel Cover", aspectLabel: "9:16", width: 400, height: 710 },
  { id: "pinterest_pin", label: "Pinterest Pin", aspectLabel: "2:3", width: 400, height: 600 },
  { id: "facebook_post", label: "Facebook Post", aspectLabel: "1.91:1", width: 600, height: 315 },
  { id: "product_listing", label: "Product Listing", aspectLabel: "1:1", width: 450, height: 450 },
  { id: "etsy_banner", label: "Shop Banner", aspectLabel: "4:1", width: 600, height: 150 },
  { id: "email_header", label: "Email Header", aspectLabel: "3:1", width: 600, height: 200 },
  { id: "flyer", label: "Flyer / Sale Poster", aspectLabel: "0.77:1", width: 400, height: 520 },
  { id: "business_card", label: "Business Card", aspectLabel: "1.75:1", width: 350, height: 200 },
  { id: "thank_you_card", label: "Thank-You Card", aspectLabel: "5:7", width: 300, height: 420 },
];

export function getFormat(id: string | null | undefined): Format | undefined {
  return FORMATS.find((f) => f.id === id);
}
