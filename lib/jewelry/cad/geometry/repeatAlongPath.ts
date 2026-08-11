import type { Shape3D } from "replicad";

import type { TessellatedPart } from "../protocol";

export type Vec3 = [number, number, number];
export type PathPoint = { position: Vec3; tangent: Vec3 };

function tessellateOnce(shape: Shape3D): { positions: Float32Array; normals: Float32Array; indices: Uint32Array } {
  const { vertices, triangles, normals } = shape.mesh({ tolerance: 0.05, angularTolerance: 0.3 });
  return { positions: new Float32Array(vertices), normals: new Float32Array(normals), indices: new Uint32Array(triangles) };
}

function normalize([x, y, z]: Vec3): Vec3 {
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function rotateAroundAxis(v: Vec3, axis: Vec3, angleRad: number): Vec3 {
  const [ax, ay, az] = axis;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const d = dot(v, axis);
  return [
    v[0] * cos + (ay * v[2] - az * v[1]) * sin + ax * d * (1 - cos),
    v[1] * cos + (az * v[0] - ax * v[2]) * sin + ay * d * (1 - cos),
    v[2] * cos + (ax * v[1] - ay * v[0]) * sin + az * d * (1 - cos),
  ];
}
// Rotation that takes local +Z to the given target direction — used to orient a
// link (built with its hole through local Z) so it faces along the chain path.
function alignZTo(v: Vec3, targetDir: Vec3): Vec3 {
  const target = normalize(targetDir);
  const cosAngle = dot([0, 0, 1], target);
  if (cosAngle > 0.9999) return v;
  if (cosAngle < -0.9999) return [v[0], -v[1], -v[2]];
  const axis = normalize(cross([0, 0, 1], target));
  return rotateAroundAxis(v, axis, Math.acos(Math.max(-1, Math.min(1, cosAngle))));
}

// Tessellates a single link shape ONCE, then repeats/transforms its raw
// {positions,normals,indices} arrays along a path via plain math — kernel cost stays
// O(1 link) instead of O(N links), avoiding hundreds of OpenCASCADE booleans for a
// long chain. Consecutive links alternate a 90° twist around the path tangent for a
// curb/cable interlock look — a visual approximation, not physically interlocked
// geometry (real links don't overlap; these are placed edge-to-edge along the path).
export function repeatShapeAlongPath(link: Shape3D, path: PathPoint[], name: string, material: "metal" | "gemstone"): TessellatedPart {
  const single = tessellateOnce(link);
  const vertexCount = single.positions.length / 3;

  const positions = new Float32Array(single.positions.length * path.length);
  const normals = new Float32Array(single.normals.length * path.length);
  const indices = new Uint32Array(single.indices.length * path.length);

  path.forEach((point, i) => {
    const twistRad = ((i % 2 === 0 ? 0 : 90) * Math.PI) / 180;

    for (let v = 0; v < vertexCount; v++) {
      const local: Vec3 = [single.positions[v * 3], single.positions[v * 3 + 1], single.positions[v * 3 + 2]];
      const aligned = alignZTo(local, point.tangent);
      const [rx, ry, rz] = rotateAroundAxis(aligned, normalize(point.tangent), twistRad);
      const base = (i * vertexCount + v) * 3;
      positions[base] = rx + point.position[0];
      positions[base + 1] = ry + point.position[1];
      positions[base + 2] = rz + point.position[2];

      const localN: Vec3 = [single.normals[v * 3], single.normals[v * 3 + 1], single.normals[v * 3 + 2]];
      const alignedN = alignZTo(localN, point.tangent);
      const [nx, ny, nz] = rotateAroundAxis(alignedN, normalize(point.tangent), twistRad);
      normals[base] = nx;
      normals[base + 1] = ny;
      normals[base + 2] = nz;
    }

    const indexOffset = i * vertexCount;
    for (let idx = 0; idx < single.indices.length; idx++) {
      indices[i * single.indices.length + idx] = single.indices[idx] + indexOffset;
    }
  });

  return { name, material, positions, normals, indices };
}

// A flat closed loop sized to circumference `lengthMm` — chain paths are deliberately
// simplified (no gravity/drape simulation, out of scope for a design tool).
export function closedLoopPath(lengthMm: number, linkSpacingMm: number, z = 0): PathPoint[] {
  const radius = lengthMm / (2 * Math.PI);
  const count = Math.max(8, Math.round(lengthMm / linkSpacingMm));
  const points: PathPoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const position: Vec3 = [radius * Math.cos(angle), radius * Math.sin(angle), z];
    const tangent: Vec3 = [-Math.sin(angle), Math.cos(angle), 0];
    points.push({ position, tangent });
  }
  return points;
}

// A short open curve from a start point down to an end point (e.g. earring-dangle's
// post-to-drop connector).
export function openDropPath(startZ: number, endZ: number, linkSpacingMm: number): PathPoint[] {
  const length = Math.abs(startZ - endZ);
  const count = Math.max(2, Math.round(length / linkSpacingMm));
  const points: PathPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    points.push({ position: [0, 0, startZ + (endZ - startZ) * t], tangent: [0, 0, 1] });
  }
  return points;
}
