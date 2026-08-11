import { makeCylinder } from "replicad";
import type { Shape3D } from "replicad";

// Friction and butterfly backs are both approximated as a small flattened disc for
// v1 — the mechanical difference (a butterfly back's spring clip vs. a friction
// back's plain push-fit) isn't modeled, only the overall silhouette.
export function buildEarringBack(type: "friction" | "butterfly", postGaugeMm: number, atZ: number): Shape3D {
  const radius = type === "butterfly" ? postGaugeMm * 2.5 : postGaugeMm * 1.8;
  const heightMm = 1.2;
  return makeCylinder(radius, heightMm, [0, 0, atZ], [0, 0, 1]);
}
