import type { Shape3D } from "replicad";

import type { RingDesign } from "../schema/ring";
import { ringInnerDiameterMm } from "../ringSizes";
import type { TessellatedAssembly, TessellatedPart } from "../protocol";
import { buildBand } from "./band";
import { buildSetting } from "./setting";

function tessellate(shape: Shape3D, name: string, material: "metal" | "gemstone"): TessellatedPart {
  const { vertices, triangles, normals } = shape.mesh({ tolerance: 0.05, angularTolerance: 0.3 });
  return {
    name,
    material,
    positions: new Float32Array(vertices),
    indices: new Uint32Array(triangles),
    normals: new Float32Array(normals),
  };
}

// Builds the metal body (band + setting mount, with the gem's seat cut out) and the
// gem, both already placed in world position — shared by the viewport rebuild and
// both export functions below, so there's exactly one place that knows how a ring
// goes together.
function buildRing(design: RingDesign): { metal: Shape3D; gem: Shape3D | null } {
  const innerRadius = ringInnerDiameterMm(design.ringSizeUS) / 2;
  const midRadius = innerRadius + design.band.thicknessMm / 2;
  const bandTopZ = design.band.widthMm / 2;

  const band = buildBand(design.band, midRadius);
  const { mount, gem } = buildSetting(design.setting);
  const placedMount = mount.translate(midRadius, 0, bandTopZ);

  let metal: Shape3D = band.fuse(placedMount);
  let placedGem: Shape3D | null = null;
  if (gem) {
    placedGem = gem.translate(midRadius, 0, bandTopZ);
    metal = metal.cut(placedGem.clone());
  }

  return { metal, gem: placedGem };
}

export function buildRingAssembly(design: RingDesign): TessellatedAssembly {
  const { metal, gem } = buildRing(design);
  const parts: TessellatedPart[] = [tessellate(metal, "band", "metal")];
  if (gem) parts.push(tessellate(gem, "gemstone", "gemstone"));
  return { parts };
}

export async function exportRingSTL(design: RingDesign): Promise<ArrayBuffer> {
  const { metal } = buildRing(design);
  const blob = metal.blobSTL({ tolerance: 0.05, angularTolerance: 0.3, binary: true });
  return blob.arrayBuffer();
}

export async function exportRingSTEP(design: RingDesign): Promise<ArrayBuffer> {
  const { metal } = buildRing(design);
  const blob = metal.blobSTEP();
  return blob.arrayBuffer();
}
