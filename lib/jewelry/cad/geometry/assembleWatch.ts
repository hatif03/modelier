import { compoundShapes } from "replicad";
import type { Shape3D } from "replicad";

import type { WatchDesign } from "../schema/watch";
import type { TessellatedAssembly, TessellatedPart } from "../protocol";
import { buildBezelRing, buildCaseShell } from "./caseShell";
import { buildSetting } from "./setting";
import { buildStrapAttachment } from "./strapAttachment";

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

function buildSolids(design: WatchDesign): { metal: Shape3D[]; gem: Shape3D | null } {
  const { body, lugTabs } = buildCaseShell(design.caseShell, design.lugs);
  const bezel = buildBezelRing(design.caseShell, design.bezel.heightMm);
  const halfHeight = (design.caseShell.shape === "round" ? design.caseShell.diameterMm ?? 38 : design.caseShell.heightMm ?? 40) / 2;
  const strapTabs = buildStrapAttachment(design.strapAttachment.widthMm, halfHeight, design.caseShell.thicknessMm);

  const metal = [body, bezel, ...lugTabs, ...strapTabs];

  let gem: Shape3D | null = null;
  if (design.bezel.style === "gem_set" && design.bezel.gemstone) {
    const outerRadius = halfHeight;
    const { mount, gem: accentGem } = buildSetting({
      type: "prong",
      prongCount: 4,
      prongHeightMm: 1.5,
      prongThicknessMm: 0.6,
      gemstone: design.bezel.gemstone,
    });
    metal.push(mount.translate(0, outerRadius, design.caseShell.thicknessMm / 2 + design.bezel.heightMm));
    if (accentGem) gem = accentGem.translate(0, outerRadius, design.caseShell.thicknessMm / 2 + design.bezel.heightMm);
  }

  return { metal, gem };
}

export function buildWatchAssembly(design: WatchDesign): TessellatedAssembly {
  const { metal, gem } = buildSolids(design);
  const parts: TessellatedPart[] = metal.map((s, i) => tessellate(s, `part-${i}`, "metal"));
  if (gem) parts.push(tessellate(gem, "bezel-gemstone", "gemstone"));
  return { parts };
}

export async function exportWatchSTL(design: WatchDesign): Promise<ArrayBuffer> {
  const { metal } = buildSolids(design);
  const blob = compoundShapes(metal).asShape3D().blobSTL({ tolerance: 0.05, angularTolerance: 0.3, binary: true });
  return blob.arrayBuffer();
}

export async function exportWatchSTEP(design: WatchDesign): Promise<ArrayBuffer> {
  const { metal } = buildSolids(design);
  const blob = compoundShapes(metal).asShape3D().blobSTEP();
  return blob.arrayBuffer();
}
