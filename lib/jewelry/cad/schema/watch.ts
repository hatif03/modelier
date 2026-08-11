import type { MetalSpec } from "./shared";
import type { GemstoneSpec } from "./shared";

// Watch CAD is deliberately scoped to the case + bezel + lugs + a static decorative
// strap representation — no movement, dial, hands, or articulated clasp/hinge
// mechanics. Modelier is a jewelry design tool, not a horology CAD suite; watches
// are covered here because their case/bezel/lugs reuse the same primitives as
// everything else (band-like bezel ring, setting-style gem accents), not because
// full watch engineering is in scope. Shown as a note in the watch panel too, not
// just here.
export type WatchDesign = {
  version: 1;
  caseShell: {
    shape: "round" | "rounded_rect";
    diameterMm?: number; // round only
    widthMm?: number; // rounded_rect only
    heightMm?: number; // rounded_rect only
    thicknessMm: number;
    metal: MetalSpec;
  };
  bezel: { style: "plain" | "fluted" | "gem_set"; heightMm: number; gemstone?: GemstoneSpec };
  lugs: { widthMm: number; style: "straight" | "curved" };
  strapAttachment: { style: "leather_look" | "metal_link_decorative"; widthMm: number };
};

const DEFAULT_METAL: MetalSpec = { color: "white", karat: "platinum" };

export const DEFAULT_WATCH_DESIGN: WatchDesign = {
  version: 1,
  caseShell: { shape: "round", diameterMm: 38, thicknessMm: 9, metal: DEFAULT_METAL },
  bezel: { style: "plain", heightMm: 2 },
  lugs: { widthMm: 6, style: "straight" },
  strapAttachment: { style: "leather_look", widthMm: 18 },
};
