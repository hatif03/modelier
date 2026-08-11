import type { BandSpec, ChainSpec, MetalSpec, SettingSpec } from "./shared";

export type EarringDesign =
  | { version: 1; style: "stud"; post: { lengthMm: number; gaugeMm: number }; back: { type: "friction" | "butterfly" }; setting: SettingSpec }
  | { version: 1; style: "hoop"; band: BandSpec; metal: MetalSpec }
  | {
      version: 1;
      style: "dangle";
      post: { lengthMm: number; gaugeMm: number };
      back: { type: "friction" | "butterfly" };
      chain: ChainSpec;
      dropLengthMm: number;
      setting: SettingSpec;
    };

const DEFAULT_METAL: MetalSpec = { color: "yellow", karat: 14 };
const DEFAULT_GEM = { shape: "round" as const, widthMm: 4, lengthMm: 4, depthMm: 2.6 };

export const DEFAULT_EARRING_DESIGNS: Record<EarringDesign["style"], EarringDesign> = {
  stud: {
    version: 1,
    style: "stud",
    post: { lengthMm: 10, gaugeMm: 0.8 },
    back: { type: "friction" },
    setting: { type: "prong", prongCount: 4, prongHeightMm: 2.5, prongThicknessMm: 0.7, gemstone: DEFAULT_GEM },
  },
  hoop: {
    version: 1,
    style: "hoop",
    // Hinge/latch mechanics aren't modeled — this is an open band only (see
    // lib/jewelry/cad/schema/earring.ts's header note).
    band: { widthMm: 1.5, thicknessMm: 1.5, profileType: "half-round", sweepAngleDeg: 340 },
    metal: DEFAULT_METAL,
  },
  dangle: {
    version: 1,
    style: "dangle",
    post: { lengthMm: 10, gaugeMm: 0.8 },
    back: { type: "friction" },
    chain: { lengthMm: 20, linkStyle: "cable", linkGaugeMm: 0.9, metal: DEFAULT_METAL },
    dropLengthMm: 20,
    setting: { type: "bezel", bezelHeightMm: 2, bezelThicknessMm: 0.5, gemstone: DEFAULT_GEM },
  },
};
