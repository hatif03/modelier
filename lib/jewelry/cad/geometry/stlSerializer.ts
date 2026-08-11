import type { TessellatedPart } from "../protocol";

// A hand-rolled binary STL writer, so parts that only exist as pre-tessellated typed
// arrays (chain links — see repeatAlongPath.ts's perf tradeoff) can still be exported
// alongside true Replicad solids. Binary STL layout: 80-byte header, uint32 triangle
// count, then per triangle: 3 floats normal + 3×3 floats vertices + uint16 padding.
export function tessellatedPartsToSTL(parts: TessellatedPart[]): ArrayBuffer {
  const triangleCount = parts.reduce((sum, p) => sum + p.indices.length / 3, 0);
  const buffer = new ArrayBuffer(80 + 4 + triangleCount * 50);
  const view = new DataView(buffer);
  view.setUint32(80, triangleCount, true);

  let offset = 84;
  for (const part of parts) {
    for (let t = 0; t < part.indices.length; t += 3) {
      const ia = part.indices[t];
      const ib = part.indices[t + 1];
      const ic = part.indices[t + 2];

      const nx = (part.normals[ia * 3] + part.normals[ib * 3] + part.normals[ic * 3]) / 3;
      const ny = (part.normals[ia * 3 + 1] + part.normals[ib * 3 + 1] + part.normals[ic * 3 + 1]) / 3;
      const nz = (part.normals[ia * 3 + 2] + part.normals[ib * 3 + 2] + part.normals[ic * 3 + 2]) / 3;
      view.setFloat32(offset, nx, true);
      view.setFloat32(offset + 4, ny, true);
      view.setFloat32(offset + 8, nz, true);

      let vOffset = offset + 12;
      for (const vi of [ia, ib, ic]) {
        view.setFloat32(vOffset, part.positions[vi * 3], true);
        view.setFloat32(vOffset + 4, part.positions[vi * 3 + 1], true);
        view.setFloat32(vOffset + 8, part.positions[vi * 3 + 2], true);
        vOffset += 12;
      }

      view.setUint16(offset + 48, 0, true);
      offset += 50;
    }
  }

  return buffer;
}
