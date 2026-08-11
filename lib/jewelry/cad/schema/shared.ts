import type { GemShapeType } from "@/lib/jewelry/gemShapes";

export type { GemShapeType };

export type MetalSpec = {
  color: "yellow" | "white" | "rose";
  karat: 10 | 14 | 18 | 22 | "platinum";
};

export type GemstoneSpec = {
  shape: GemShapeType;
  widthMm: number;
  lengthMm: number; // == widthMm for "round"
  depthMm: number;
};

// `gemstone` is optional — a plain/decorative setting (e.g. a watch bezel with no
// stone) is the same primitive as a gem-set one, just without the cut seat + gem mesh.
export type SettingSpec =
  | { type: "prong"; prongCount: 4 | 6; prongHeightMm: number; prongThicknessMm: number; gemstone?: GemstoneSpec }
  | { type: "bezel"; bezelHeightMm: number; bezelThicknessMm: number; gemstone?: GemstoneSpec };

export type BandSpec = {
  widthMm: number;
  thicknessMm: number;
  profileType: "flat" | "half-round" | "comfort-fit" | "knife-edge";
  /** 360 = a closed ring/bangle; less than 360 = an open hoop/cuff. */
  sweepAngleDeg: number;
};

export type ChainSpec = {
  lengthMm: number;
  linkStyle: "cable" | "curb" | "rope" | "box";
  linkGaugeMm: number;
  metal: MetalSpec;
};

export type ClaspSpec = {
  type: "lobster" | "springRing" | "toggle" | "magnetic";
  metal: MetalSpec;
};

export const DEFAULT_METAL: MetalSpec = { color: "yellow", karat: 14 };

export const DEFAULT_GEMSTONE: GemstoneSpec = { shape: "round", widthMm: 5, lengthMm: 5, depthMm: 3.2 };
