import { compoundShapes } from "replicad";
import type { Shape3D } from "replicad";

import type { NecklaceDesign } from "../schema/necklace";
import type { TessellatedAssembly, TessellatedPart } from "../protocol";
import { buildClosedChain } from "./chain";
import { buildClasp } from "./clasp";
import { buildSetting } from "./setting";
import { tessellatedPartsToSTL } from "./stlSerializer";

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

// Solid parts (clasp + optional pendant) as live Replicad shapes, plus the chain as
// an already-tessellated part (see chain.ts) — STEP export can only use the former
// (STEP needs true BREP solids), STL export can use both (STL is just triangles).
function buildParts(design: NecklaceDesign): { solids: Shape3D[]; chainPart: TessellatedPart } {
  const radius = design.chain.lengthMm / (2 * Math.PI);
  const solids: Shape3D[] = [buildClasp(design.clasp).translate(radius, 0, 0)];

  if (design.pendant) {
    const { mount, gem } = buildSetting(design.pendant.setting);
    const pendantZ = -design.pendant.offsetMm;
    solids.push(mount.translate(-radius, 0, pendantZ));
    if (gem) solids.push(gem.translate(-radius, 0, pendantZ));
  }

  return { solids, chainPart: buildClosedChain(design.chain) };
}

export function buildNecklaceAssembly(design: NecklaceDesign): TessellatedAssembly {
  const { solids, chainPart } = buildParts(design);
  const parts: TessellatedPart[] = [chainPart];
  solids.forEach((solid, i) => parts.push(tessellate(solid, `part-${i}`, "metal")));
  return { parts };
}

export async function exportNecklaceSTL(design: NecklaceDesign): Promise<ArrayBuffer> {
  const { solids, chainPart } = buildParts(design);
  const solidParts = solids.map((s, i) => tessellate(s, `part-${i}`, "metal"));
  return tessellatedPartsToSTL([chainPart, ...solidParts]);
}

// Chain links are pre-tessellated for performance (see chain.ts) and have no live
// BREP solid to export, so STEP export covers only the clasp/pendant — STL export
// above covers the full assembly including the chain.
export async function exportNecklaceSTEP(design: NecklaceDesign): Promise<ArrayBuffer> {
  const { solids } = buildParts(design);
  const blob = compoundShapes(solids).asShape3D().blobSTEP();
  return blob.arrayBuffer();
}
