import type { ChainSpec, ClaspSpec, SettingSpec } from "./shared";

export type NecklaceDesign = {
  version: 1;
  chain: ChainSpec;
  clasp: ClaspSpec;
  pendant?: { offsetMm: number; bailDiameterMm: number; setting: SettingSpec };
};

export const DEFAULT_NECKLACE_DESIGN: NecklaceDesign = {
  version: 1,
  chain: { lengthMm: 450, linkStyle: "cable", linkGaugeMm: 1.2, metal: { color: "yellow", karat: 14 } },
  clasp: { type: "lobster", metal: { color: "yellow", karat: 14 } },
  pendant: {
    offsetMm: 8,
    bailDiameterMm: 3,
    setting: { type: "bezel", bezelHeightMm: 2.4, bezelThicknessMm: 0.6, gemstone: { shape: "round", widthMm: 5, lengthMm: 5, depthMm: 3.2 } },
  },
};
