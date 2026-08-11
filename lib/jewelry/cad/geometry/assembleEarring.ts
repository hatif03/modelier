import type { Shape3D } from "replicad";

import type { EarringDesign } from "../schema/earring";
import type { TessellatedAssembly, TessellatedPart } from "../protocol";
import { buildBand } from "./band";
import { buildDropChain } from "./chain";
import { buildEarringBack } from "./earringBack";
import { buildPost } from "./post";
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

function buildSolids(design: EarringDesign): Shape3D[] {
  if (design.style === "hoop") {
    return [buildBand(design.band, design.band.thicknessMm * 4)];
  }

  const { mount, gem } = buildSetting(design.setting);
  const solids: Shape3D[] = [buildPost(design.post.lengthMm, design.post.gaugeMm), mount];
  if (gem) solids.push(gem);
  solids.push(buildEarringBack(design.back.type, design.post.gaugeMm, -design.post.lengthMm * 0.55));

  if (design.style === "dangle") {
    const dropZ = -design.dropLengthMm;
    const { mount: dropMount, gem: dropGem } = buildSetting(design.setting);
    solids.push(dropMount.translate(0, 0, dropZ));
    if (dropGem) solids.push(dropGem.translate(0, 0, dropZ));
  }

  return solids;
}

export function buildEarringAssembly(design: EarringDesign): TessellatedAssembly {
  const parts: TessellatedPart[] = [];

  if (design.style === "dangle") {
    parts.push(buildDropChain(design.chain, 0, -design.dropLengthMm));
  }

  buildSolids(design).forEach((solid, i) => {
    // Gemstones are always the shape's second solid for stud/dangle (post, mount,
    // [gem], back, ...) — a small material-tag heuristic good enough for v1 shading.
    const isGem = design.style !== "hoop" && i === 1 && Boolean(design.setting.gemstone);
    parts.push(tessellate(solid, `part-${i}`, isGem ? "gemstone" : "metal"));
  });

  return { parts };
}

export async function exportEarringSTL(design: EarringDesign): Promise<ArrayBuffer> {
  const solidParts = buildSolids(design).map((s, i) => tessellate(s, `part-${i}`, "metal"));
  if (design.style === "dangle") {
    return tessellatedPartsToSTL([buildDropChain(design.chain, 0, -design.dropLengthMm), ...solidParts]);
  }
  return tessellatedPartsToSTL(solidParts);
}

export async function exportEarringSTEP(design: EarringDesign): Promise<ArrayBuffer> {
  const { compoundShapes } = await import("replicad");
  const blob = compoundShapes(buildSolids(design)).asShape3D().blobSTEP();
  return blob.arrayBuffer();
}
