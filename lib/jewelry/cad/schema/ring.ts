import { DEFAULT_GEMSTONE, DEFAULT_METAL, type BandSpec, type MetalSpec, type SettingSpec } from "./shared";

// The JewelryDesign.designJson shape for method "cad", category "ring" — a plain
// declarative spec rebuilt into geometry from scratch every time (no operation-history
// stack), so it round-trips through save/reload and is exactly what the AI assistant's
// structured edits (lib/jewelry/cad/assistant.ts) target.
export type RingDesign = {
  version: 1;
  ringSizeUS: number;
  metal: MetalSpec;
  band: BandSpec;
  setting: SettingSpec;
};

export const DEFAULT_RING_DESIGN: RingDesign = {
  version: 1,
  ringSizeUS: 7,
  metal: DEFAULT_METAL,
  band: { widthMm: 2, thicknessMm: 1.8, profileType: "half-round", sweepAngleDeg: 360 },
  setting: {
    type: "prong",
    prongCount: 6,
    prongHeightMm: 3,
    prongThicknessMm: 0.9,
    gemstone: DEFAULT_GEMSTONE,
  },
};
