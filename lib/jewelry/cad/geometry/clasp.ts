import { makeCylinder, makeSphere } from "replicad";
import type { Shape3D } from "replicad";

import type { ClaspSpec } from "../schema/shared";

// A static decorative shape per clasp type — not an articulated/hinged mechanism
// (matches the same "static representation, no mechanics" scoping already used for
// chain links and watch straps). All four types share a capsule-ish silhouette for
// v1; the distinguishing shape (a spring ring's true torus-with-gap, a lobster
// clasp's lever) is a later refinement, not a pipeline concern.
export function buildClasp(spec: ClaspSpec): Shape3D {
  const lengthMm = spec.type === "toggle" ? 6 : 8;
  const radiusMm = spec.type === "magnetic" ? 2.2 : 1.6;

  const body = makeCylinder(radiusMm, lengthMm, [0, 0, -lengthMm / 2], [0, 0, 1]);
  const capTop = makeSphere(radiusMm).translate(0, 0, lengthMm / 2);
  const capBottom = makeSphere(radiusMm).translate(0, 0, -lengthMm / 2);

  return body.fuse(capTop).fuse(capBottom);
}
