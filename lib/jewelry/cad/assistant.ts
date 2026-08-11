import type { JewelryCategory } from "@/lib/ai-model-studio/types";

// The AI design assistant emits constrained, structured edits against a fixed set of
// dot-paths per category — never arbitrary code (unlike AI-CAD's raw-code-gen
// approach), matching the same safe pattern already used for Video Studio's
// auto-assemble. Scoped to `set_param` on existing scalar fields only for v1 —
// switching a discriminant (setting.type, earring.style, ...) or adding/removing a
// whole sub-feature (a necklace pendant, a bracelet charm) stays a UI-only action,
// since those need a fully-formed replacement object, not a single scalar edit.
export type PathRule = { path: string; type: "number" | "string"; min?: number; max?: number; enumValues?: string[] };

const METAL_COLORS = ["yellow", "white", "rose"];

export const ALLOWED_PATHS: Record<JewelryCategory, PathRule[]> = {
  ring: [
    { path: "ringSizeUS", type: "number", min: 3, max: 13 },
    { path: "metal.color", type: "string", enumValues: METAL_COLORS },
    { path: "band.widthMm", type: "number", min: 1, max: 8 },
    { path: "band.thicknessMm", type: "number", min: 1, max: 4 },
    { path: "band.profileType", type: "string", enumValues: ["flat", "half-round", "comfort-fit", "knife-edge"] },
    { path: "setting.gemstone.shape", type: "string", enumValues: ["round", "oval", "marquise", "pear", "emerald"] },
    { path: "setting.gemstone.widthMm", type: "number", min: 2, max: 12 },
    { path: "setting.gemstone.lengthMm", type: "number", min: 2, max: 16 },
    { path: "setting.gemstone.depthMm", type: "number", min: 1.5, max: 8 },
  ],
  necklace: [
    { path: "chain.lengthMm", type: "number", min: 350, max: 900 },
    { path: "chain.linkStyle", type: "string", enumValues: ["cable", "curb", "rope", "box"] },
    { path: "chain.linkGaugeMm", type: "number", min: 0.6, max: 3 },
    { path: "clasp.type", type: "string", enumValues: ["lobster", "springRing", "toggle", "magnetic"] },
    { path: "pendant.offsetMm", type: "number", min: 4, max: 30 },
    { path: "pendant.setting.gemstone.shape", type: "string", enumValues: ["round", "oval", "marquise", "pear", "emerald"] },
    { path: "pendant.setting.gemstone.widthMm", type: "number", min: 2, max: 12 },
  ],
  earring: [
    { path: "post.lengthMm", type: "number", min: 6, max: 14 },
    { path: "setting.gemstone.shape", type: "string", enumValues: ["round", "oval", "marquise", "pear", "emerald"] },
    { path: "setting.gemstone.widthMm", type: "number", min: 2, max: 8 },
    { path: "dropLengthMm", type: "number", min: 10, max: 50 },
    { path: "band.thicknessMm", type: "number", min: 0.8, max: 4 },
    { path: "band.sweepAngleDeg", type: "number", min: 270, max: 360 },
  ],
  bracelet: [
    { path: "chain.lengthMm", type: "number", min: 140, max: 230 },
    { path: "band.widthMm", type: "number", min: 3, max: 15 },
    { path: "band.thicknessMm", type: "number", min: 1.5, max: 6 },
    { path: "band.sweepAngleDeg", type: "number", min: 260, max: 350 },
  ],
  watch: [
    { path: "caseShell.diameterMm", type: "number", min: 28, max: 46 },
    { path: "caseShell.thicknessMm", type: "number", min: 6, max: 14 },
    { path: "bezel.style", type: "string", enumValues: ["plain", "fluted", "gem_set"] },
    { path: "strapAttachment.style", type: "string", enumValues: ["leather_look", "metal_link_decorative"] },
  ],
};

export function buildSystemPrompt(category: JewelryCategory): string {
  const rules = ALLOWED_PATHS[category];
  const description = rules
    .map((r) => `- "${r.path}" (${r.type}${r.enumValues ? `: ${r.enumValues.join("|")}` : r.min !== undefined ? `, ${r.min}-${r.max}` : ""})`)
    .join("\n");

  return [
    `You are a jewelry design assistant editing a "${category}" piece in Modelier's 3D Studio.`,
    `You may only edit these fields, using a "set_param" operation with an exact "path" from this list and a "value" matching its type/range:`,
    description,
    `Respond with ONLY a JSON object, no prose, no markdown fences, matching exactly this shape:`,
    `{"edits": [{"op": "set_param", "path": string, "value": string | number}], "notes": string}`,
    `"notes" is one short sentence explaining what you changed. If the request needs a field not in the list above (e.g. adding or removing a whole feature, or changing a shape's fundamental type), leave "edits" empty and explain in "notes" that it needs the panel controls instead.`,
  ].join("\n");
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined), obj);
}

function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let cursor: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const next = cursor[keys[i]];
    if (!next || typeof next !== "object") return; // parent doesn't exist (e.g. no pendant yet) — silently no-op
    cursor = next as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}

export type ProposedEdit = { op: string; path: string; value: unknown };
export type ApplyResult = { tree: unknown; applied: string[]; rejected: { path: string; reason: string }[] };

// Re-validates every edit against the category's rules before applying it — the
// system prompt's path list is the first line of defense, this is the actual
// safety boundary (an LLM can still emit an out-of-range value or an unlisted path).
export function applyEdits(category: JewelryCategory, tree: unknown, edits: ProposedEdit[]): ApplyResult {
  const rules = ALLOWED_PATHS[category];
  const next = structuredClone(tree) as Record<string, unknown>;
  const applied: string[] = [];
  const rejected: { path: string; reason: string }[] = [];

  for (const edit of edits) {
    if (edit.op !== "set_param") {
      rejected.push({ path: edit.path, reason: `Unsupported operation "${edit.op}".` });
      continue;
    }
    const rule = rules.find((r) => r.path === edit.path);
    if (!rule) {
      rejected.push({ path: edit.path, reason: "Not an editable field for this category." });
      continue;
    }
    if (rule.type === "number") {
      const value = Number(edit.value);
      if (Number.isNaN(value) || (rule.min !== undefined && value < rule.min) || (rule.max !== undefined && value > rule.max)) {
        rejected.push({ path: edit.path, reason: `Must be a number between ${rule.min} and ${rule.max}.` });
        continue;
      }
      if (getByPath(next, edit.path) === undefined) {
        rejected.push({ path: edit.path, reason: "That field doesn't exist on the current design (e.g. no pendant yet)." });
        continue;
      }
      setByPath(next, edit.path, value);
      applied.push(edit.path);
    } else {
      const value = String(edit.value);
      if (rule.enumValues && !rule.enumValues.includes(value)) {
        rejected.push({ path: edit.path, reason: `Must be one of: ${rule.enumValues.join(", ")}.` });
        continue;
      }
      if (getByPath(next, edit.path) === undefined) {
        rejected.push({ path: edit.path, reason: "That field doesn't exist on the current design (e.g. no pendant yet)." });
        continue;
      }
      setByPath(next, edit.path, value);
      applied.push(edit.path);
    }
  }

  return { tree: next, applied, rejected };
}
