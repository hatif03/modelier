import { makeBox, makeCylinder, sketchCircle } from "replicad";
import type { Shape3D } from "replicad";

import type { WatchDesign } from "../schema/watch";

// Case body + lug tabs only — round or rounded-rect (approximated as a plain box for
// v1, no corner rounding yet). No movement/dial/hands/crown — see
// lib/jewelry/cad/schema/watch.ts's header note on why watch CAD stops at the shell.
export function buildCaseShell(caseShell: WatchDesign["caseShell"], lugs: WatchDesign["lugs"]): { body: Shape3D; lugTabs: Shape3D[] } {
  const height = caseShell.thicknessMm;
  const halfWidth = (caseShell.shape === "round" ? caseShell.diameterMm ?? 38 : caseShell.widthMm ?? 34) / 2;
  const halfHeight = (caseShell.shape === "round" ? caseShell.diameterMm ?? 38 : caseShell.heightMm ?? 40) / 2;

  const body =
    caseShell.shape === "round"
      ? makeCylinder(halfWidth, height, [0, 0, -height / 2], [0, 0, 1])
      : makeBox([-halfWidth, -halfHeight, -height / 2], [halfWidth, halfHeight, height / 2]);

  const lugTabs = [1, -1].map((sign) => makeBox([-lugs.widthMm / 2, sign * halfHeight, 0], [lugs.widthMm / 2, sign * (halfHeight + 4), height * 0.6]));

  return { body, lugTabs };
}

// A plain decorative ring sitting on top of the case at its outer edge — "fluted"
// and "gem_set" bezel styles are visual variations layered on this same base ring
// (fluted texturing isn't modeled in v1; gem_set adds one accent gem elsewhere).
export function buildBezelRing(caseShell: WatchDesign["caseShell"], bezelHeightMm: number): Shape3D {
  const outerRadius = (caseShell.shape === "round" ? caseShell.diameterMm ?? 38 : caseShell.heightMm ?? 40) / 2;
  // `origin: [0,0,0]` is required — see chain.ts's buildLink for why omitting it
  // (defaulting to the sketch's own off-axis origin) creates a degenerate revolve
  // that hangs OpenCASCADE instead of throwing.
  return sketchCircle(1.4, { plane: "XZ", origin: [outerRadius, 0, 0] })
    .revolve([0, 0, 1], { origin: [0, 0, 0], angle: 360 })
    .translate(0, 0, caseShell.thicknessMm / 2 + bezelHeightMm / 2);
}
