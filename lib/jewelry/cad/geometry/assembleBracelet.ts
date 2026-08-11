import { compoundShapes } from "replicad";
import type { Shape3D } from "replicad";

import type { BraceletDesign } from "../schema/bracelet";
import type { TessellatedAssembly, TessellatedPart } from "../protocol";
import { buildBand } from "./band";
import { buildClosedChain } from "./chain";
import { buildClasp } from "./clasp";
import { buildSetting } from "./setting";
import { tessellatedPartsToSTL } from "./stlSerializer";

// A typical wrist inner diameter for a bangle/cuff — bracelets aren't sized off the
// same US ring-size table rings use.
const BRACELET_INNER_DIAMETER_MM = 65;

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

export function buildBraceletAssembly(design: BraceletDesign): TessellatedAssembly {
  if (design.style === "chain") {
    const radius = design.chain.lengthMm / (2 * Math.PI);
    const parts: TessellatedPart[] = [buildClosedChain(design.chain)];
    parts.push(tessellate(buildClasp(design.clasp).translate(radius, 0, 0), "clasp", "metal"));
    if (design.charm) {
      const { mount, gem } = buildSetting(design.charm.setting);
      parts.push(tessellate(mount.translate(-radius, 0, 0), "charm-setting", "metal"));
      if (gem) parts.push(tessellate(gem.translate(-radius, 0, 0), "charm-gemstone", "gemstone"));
    }
    return { parts };
  }

  const midRadius = BRACELET_INNER_DIAMETER_MM / 2 + design.band.thicknessMm / 2;
  const band = buildBand(design.band, midRadius);
  return { parts: [tessellate(band, "band", "metal")] };
}

export async function exportBraceletSTL(design: BraceletDesign): Promise<ArrayBuffer> {
  if (design.style === "chain") {
    const radius = design.chain.lengthMm / (2 * Math.PI);
    const solids: Shape3D[] = [buildClasp(design.clasp).translate(radius, 0, 0)];
    if (design.charm) {
      const { mount, gem } = buildSetting(design.charm.setting);
      solids.push(mount.translate(-radius, 0, 0));
      if (gem) solids.push(gem.translate(-radius, 0, 0));
    }
    const solidParts = solids.map((s, i) => tessellate(s, `part-${i}`, "metal"));
    return tessellatedPartsToSTL([buildClosedChain(design.chain), ...solidParts]);
  }

  const midRadius = BRACELET_INNER_DIAMETER_MM / 2 + design.band.thicknessMm / 2;
  const band = buildBand(design.band, midRadius);
  const blob = band.blobSTL({ tolerance: 0.05, angularTolerance: 0.3, binary: true });
  return blob.arrayBuffer();
}

export async function exportBraceletSTEP(design: BraceletDesign): Promise<ArrayBuffer> {
  if (design.style === "chain") {
    const radius = design.chain.lengthMm / (2 * Math.PI);
    const solids: Shape3D[] = [buildClasp(design.clasp).translate(radius, 0, 0)];
    if (design.charm) {
      const { mount, gem } = buildSetting(design.charm.setting);
      solids.push(mount.translate(-radius, 0, 0));
      if (gem) solids.push(gem.translate(-radius, 0, 0));
    }
    const blob = compoundShapes(solids).asShape3D().blobSTEP();
    return blob.arrayBuffer();
  }

  const midRadius = BRACELET_INNER_DIAMETER_MM / 2 + design.band.thicknessMm / 2;
  const band = buildBand(design.band, midRadius);
  const blob = band.blobSTEP();
  return blob.arrayBuffer();
}
