import { sketchRoundedRectangle } from "replicad";
import type { Shape3D } from "replicad";

import type { BandSpec } from "../schema/shared";

// A band is a cross-section profile, offset out to the ring's mid-radius on the XZ
// plane, revolved around the Z axis (partial sweepAngleDeg for hoops/cuffs, 360 for a
// closed ring/bangle). The cross-section shape itself (rather than a post-hoc fillet
// on a revolved solid, which needs a fiddly EdgeFinder) is what gives each profile its
// look — a rounded rectangle whose corner radius scales with the profile type.
export function buildBand(band: BandSpec, midRadiusMm: number): Shape3D {
  const cornerRadius =
    band.profileType === "flat"
      ? 0
      : band.profileType === "knife-edge"
        ? band.thicknessMm * 0.15
        : band.thicknessMm * 0.48; // half-round / comfort-fit — near-maximal rounding

  const profile = sketchRoundedRectangle(band.thicknessMm, band.widthMm, cornerRadius, {
    plane: "XZ",
    origin: [midRadiusMm, 0, 0],
  });

  return profile.revolve([0, 0, 1], { origin: [0, 0, 0], angle: band.sweepAngleDeg });
}
