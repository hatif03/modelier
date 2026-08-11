import { makeCylinder, makeSphere } from "replicad";
import type { Shape3D } from "replicad";

// The post that goes through the earlobe — a thin cylinder with a small ball tip,
// extending in -Z (away from the setting/mount, which sits at z=0) by lengthMm.
export function buildPost(lengthMm: number, gaugeMm: number): Shape3D {
  const cylinder = makeCylinder(gaugeMm / 2, lengthMm, [0, 0, -lengthMm], [0, 0, 1]);
  const tip = makeSphere(gaugeMm / 2).translate(0, 0, -lengthMm);
  return cylinder.fuse(tip);
}
