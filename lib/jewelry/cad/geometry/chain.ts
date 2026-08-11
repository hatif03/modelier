import { sketchCircle } from "replicad";
import type { Shape3D } from "replicad";

import type { ChainSpec } from "../schema/shared";
import { closedLoopPath, openDropPath, repeatShapeAlongPath } from "./repeatAlongPath";
import type { TessellatedPart } from "../protocol";

// A single chain link — a small closed torus (a jump ring), sized by gauge. Built
// once via Replicad, then repeated along a path by repeatShapeAlongPath (see that
// module for why: booleaning hundreds of links through OpenCASCADE would be a real
// performance risk for a browser-side kernel).
function buildLink(gaugeMm: number): Shape3D {
  const linkRadius = gaugeMm * 1.6;
  // `origin` must be explicit here — omitting it defaults the revolve axis to the
  // *sketch's own* origin (i.e. the profile's own placement point), not world origin,
  // which for a profile already offset from the world axis creates a degenerate
  // revolve (axis passing through the profile itself) that hangs OpenCASCADE's
  // BRepPrimAPI_MakeRevol instead of throwing. buildBand in band.ts already gets this
  // right; this was the one spot that didn't.
  return sketchCircle(gaugeMm / 2, { plane: "XZ", origin: [linkRadius, 0, 0] }).revolve([0, 0, 1], { origin: [0, 0, 0], angle: 360 });
}

export function buildClosedChain(spec: ChainSpec, z = 0): TessellatedPart {
  const link = buildLink(spec.linkGaugeMm);
  const spacing = spec.linkGaugeMm * 2.4;
  const path = closedLoopPath(spec.lengthMm, spacing, z);
  return repeatShapeAlongPath(link, path, "chain", "metal");
}

export function buildDropChain(spec: ChainSpec, startZ: number, endZ: number): TessellatedPart {
  const link = buildLink(spec.linkGaugeMm);
  const spacing = spec.linkGaugeMm * 2.4;
  const path = openDropPath(startZ, endZ, spacing);
  return repeatShapeAlongPath(link, path, "drop-chain", "metal");
}
