import { draw, drawCircle, drawEllipse, drawRoundedRectangle } from "replicad";
import type { Drawing, Shape3D } from "replicad";

import type { GemShapeType } from "../schema/shared";

// Real 3D geometry for the same 5 GemShapeType values lib/jewelry/gemShapes.ts already
// uses for the (explicitly flat, 2D-only) Sketch tool — reusing that taxonomy for
// continuity. Every shape is built the same way: a 2D girdle outline, extruded up
// (crown) and down (pavilion) with an inward taper, then fused at the girdle — a
// faceted-look approximation, not full brilliant-cut faceting.
export function girdleOutline(shape: GemShapeType, widthMm: number, lengthMm: number): Drawing {
  switch (shape) {
    case "round":
      return drawCircle(widthMm / 2);
    case "oval":
      return drawEllipse(lengthMm / 2, widthMm / 2);
    case "emerald":
      // Rounded-corner rectangle — the same simplification gemShapes.ts's 2D sketch
      // tool already uses in place of a true cut-corner octagon.
      return drawRoundedRectangle(lengthMm, widthMm, Math.min(widthMm, lengthMm) * 0.12);
    case "marquise": {
      const halfL = lengthMm / 2;
      const halfW = widthMm / 2;
      return draw([-halfL, 0])
        .threePointsArcTo([0, halfW], [-halfL / 2, halfW * 0.92])
        .threePointsArcTo([halfL, 0], [halfL / 2, halfW * 0.92])
        .threePointsArcTo([0, -halfW], [halfL / 2, -halfW * 0.92])
        .threePointsArcTo([-halfL, 0], [-halfL / 2, -halfW * 0.92])
        .close();
    }
    case "pear": {
      const halfL = lengthMm / 2;
      const halfW = widthMm / 2;
      return draw([0, -halfL])
        .threePointsArcTo([halfW, 0], [halfW * 0.75, -halfL / 2])
        .threePointsArcTo([0, halfL], [halfW * 0.55, halfL / 2])
        .threePointsArcTo([-halfW, 0], [-halfW * 0.55, halfL / 2])
        .threePointsArcTo([0, -halfL], [-halfW * 0.75, -halfL / 2])
        .close();
    }
  }
}

export function buildGemstone(shape: GemShapeType, widthMm: number, lengthMm: number, depthMm: number): Shape3D {
  const outline = girdleOutline(shape, widthMm, lengthMm);
  const girdleSketch = outline.sketchOnPlane("XY", [0, 0, 0]);

  const crownHeight = depthMm * 0.35;
  const pavilionDepth = depthMm * 0.65;

  const crown = (girdleSketch as any)
    .clone()
    .extrude(crownHeight, { extrusionDirection: [0, 0, 1], extrusionProfile: { profile: "linear", endFactor: 0.25 } });
  const pavilion = (girdleSketch as any)
    .clone()
    .extrude(pavilionDepth, { extrusionDirection: [0, 0, -1], extrusionProfile: { profile: "linear", endFactor: 0.05 } });

  return crown.fuse(pavilion);
}
