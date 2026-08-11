// Runs inside a dedicated Web Worker — every Replicad/OpenCASCADE call lives here,
// never on the main thread. See lib/jewelry/cad/client.ts for the request/response
// wrapper and lib/jewelry/cad/protocol.ts for the message shapes.
// The "with_exceptions" build (not the leaner "single" build) — the single build
// compiles OCCT without C++ exception catching, so any internal OpenCASCADE failure
// (e.g. a degenerate boolean/mesh operation) surfaces as a bare numeric exception
// pointer ("Error: 10042560") instead of a readable message. Same single-threaded
// model either way — this is unrelated to the pthreads/SharedArrayBuffer build that
// would need COOP/COEP headers, so it doesn't force that carve-out.
import initOpenCascade from "replicad-opencascadejs/src/replicad_with_exceptions.js";
// @ts-expect-error -- resolved to a URL string via next.config.mjs's asset/resource rule for *.wasm
import wasmUrl from "replicad-opencascadejs/src/replicad_with_exceptions.wasm";
import { setOC } from "replicad";

import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import type { CadRequest, CadResponse, TessellatedAssembly } from "./protocol";
import { buildRingAssembly, exportRingSTEP, exportRingSTL } from "./geometry/assembleRing";
import { buildNecklaceAssembly, exportNecklaceSTEP, exportNecklaceSTL } from "./geometry/assembleNecklace";
import { buildEarringAssembly, exportEarringSTEP, exportEarringSTL } from "./geometry/assembleEarring";
import { buildBraceletAssembly, exportBraceletSTEP, exportBraceletSTL } from "./geometry/assembleBracelet";
import { buildWatchAssembly, exportWatchSTEP, exportWatchSTL } from "./geometry/assembleWatch";

type CadDispatch = {
  rebuild: (tree: unknown) => TessellatedAssembly;
  exportSTL: (tree: unknown) => Promise<ArrayBuffer>;
  exportSTEP: (tree: unknown) => Promise<ArrayBuffer>;
};

const DISPATCH: Record<JewelryCategory, CadDispatch> = {
  ring: { rebuild: (t) => buildRingAssembly(t as any), exportSTL: (t) => exportRingSTL(t as any), exportSTEP: (t) => exportRingSTEP(t as any) },
  necklace: {
    rebuild: (t) => buildNecklaceAssembly(t as any),
    exportSTL: (t) => exportNecklaceSTL(t as any),
    exportSTEP: (t) => exportNecklaceSTEP(t as any),
  },
  earring: {
    rebuild: (t) => buildEarringAssembly(t as any),
    exportSTL: (t) => exportEarringSTL(t as any),
    exportSTEP: (t) => exportEarringSTEP(t as any),
  },
  bracelet: {
    rebuild: (t) => buildBraceletAssembly(t as any),
    exportSTL: (t) => exportBraceletSTL(t as any),
    exportSTEP: (t) => exportBraceletSTEP(t as any),
  },
  watch: { rebuild: (t) => buildWatchAssembly(t as any), exportSTL: (t) => exportWatchSTL(t as any), exportSTEP: (t) => exportWatchSTEP(t as any) },
};

// Typed loosely against `self` rather than pulling in the "webworker" lib — that lib
// redeclares globals incompatibly with this project's "dom" lib (tsconfig.json), and
// this file is the only place that needs worker-scope typings at all.
declare const self: {
  onmessage: ((event: MessageEvent<CadRequest>) => void) | null;
  postMessage: (message: CadResponse, transfer?: Transferable[]) => void;
};

// The .d.ts under-declares this as a zero-arg factory (`init(): Promise<...>`), but
// it's a standard Emscripten ES6-modularized module — the real runtime signature
// accepts an optional module-overrides object, which is how `locateFile` is meant to
// be supplied (confirmed by reading the glue's own `locateFile()` implementation,
// which checks `Module["locateFile"]`).
const initOpenCascadeWithConfig = initOpenCascade as unknown as (config: { locateFile: (path: string) => string }) => Promise<unknown>;

let ocReady: Promise<void> | null = null;
function ensureOC(): Promise<void> {
  if (!ocReady) {
    ocReady = initOpenCascadeWithConfig({ locateFile: () => wasmUrl }).then((oc: unknown) => {
      setOC(oc as any);
    });
  }
  return ocReady;
}

async function handle(req: CadRequest): Promise<unknown> {
  await ensureOC();

  const dispatch = DISPATCH[req.payload.category];
  if (!dispatch) throw new Error(`CAD support for "${req.payload.category}" isn't built yet.`);
  const { tree } = req.payload;

  switch (req.type) {
    case "rebuild":
      return dispatch.rebuild(tree);
    case "exportSTL":
      return { buffer: await dispatch.exportSTL(tree) };
    case "exportSTEP":
      return { buffer: await dispatch.exportSTEP(tree) };
  }
}

self.onmessage = async (event: MessageEvent<CadRequest>) => {
  const req = event.data;
  try {
    const payload = await handle(req);
    const response = { id: req.id, type: req.type, success: true, payload } as CadResponse;
    const transferables =
      req.type === "exportSTL" || req.type === "exportSTEP" ? [(payload as { buffer: ArrayBuffer }).buffer] : [];
    self.postMessage(response, transferables);
  } catch (err) {
    self.postMessage({
      id: req.id,
      type: req.type,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
