// Message shapes crossing the Web Worker boundary (lib/jewelry/cad/worker.ts +
// client.ts) — modeled on elhakimz/webcad's OCCWorker.ts message-passing pattern
// (studied, not vendored — see the plan for why webcad itself wasn't reused).
// Geometry only ever crosses as plain typed arrays, never as live Replicad objects.
import type { JewelryCategory } from "@/lib/ai-model-studio/types";

export type TessellatedPart = {
  name: string;
  material: "metal" | "gemstone";
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
};

export type TessellatedAssembly = { parts: TessellatedPart[] };

export type CadRequest =
  | { id: string; type: "rebuild"; payload: { category: JewelryCategory; tree: unknown } }
  | { id: string; type: "exportSTL"; payload: { category: JewelryCategory; tree: unknown } }
  | { id: string; type: "exportSTEP"; payload: { category: JewelryCategory; tree: unknown } };

export type CadResponse =
  | { id: string; type: "rebuild"; success: true; payload: TessellatedAssembly }
  | { id: string; type: "exportSTL" | "exportSTEP"; success: true; payload: { buffer: ArrayBuffer } }
  | { id: string; type: string; success: false; error: string };
