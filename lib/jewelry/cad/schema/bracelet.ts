import type { BandSpec, ChainSpec, ClaspSpec, SettingSpec } from "./shared";

export type BraceletDesign =
  | { version: 1; style: "chain"; chain: ChainSpec; clasp: ClaspSpec; charm?: { setting: SettingSpec } }
  | { version: 1; style: "bangle"; band: BandSpec }
  | { version: 1; style: "cuff"; band: BandSpec };

const DEFAULT_METAL = { color: "yellow" as const, karat: 14 as const };

export const DEFAULT_BRACELET_DESIGNS: Record<BraceletDesign["style"], BraceletDesign> = {
  chain: {
    version: 1,
    style: "chain",
    chain: { lengthMm: 180, linkStyle: "curb", linkGaugeMm: 1.4, metal: DEFAULT_METAL },
    clasp: { type: "lobster", metal: DEFAULT_METAL },
  },
  bangle: {
    version: 1,
    style: "bangle",
    band: { widthMm: 6, thicknessMm: 3, profileType: "half-round", sweepAngleDeg: 360 },
  },
  cuff: {
    version: 1,
    style: "cuff",
    band: { widthMm: 8, thicknessMm: 2.4, profileType: "flat", sweepAngleDeg: 300 },
  },
};
