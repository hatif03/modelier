import { makeBox } from "replicad";
import type { Shape3D } from "replicad";

// A static, non-articulated strap representation pinned to the case's lugs — no
// buckle/clasp mechanism modeled, consistent with watch CAD's scoping (see
// lib/jewelry/cad/schema/watch.ts). Both styles are the same flat tapered extrusion
// for v1; "metal_link_decorative" is a materials/texture distinction, not a
// different geometry.
export function buildStrapAttachment(widthMm: number, lugHalfHeightMm: number, thicknessMm: number): Shape3D[] {
  const lengthMm = 20;
  return [1, -1].map((sign) =>
    makeBox(
      [-widthMm / 2, sign * lugHalfHeightMm, -thicknessMm / 2],
      [widthMm / 2, sign * (lugHalfHeightMm + lengthMm), thicknessMm / 2]
    )
  );
}
