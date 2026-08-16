// AI Nail VTO (polish or press-on-nail effects, per-finger config). Schema
// confirmed against https://docs.perfectcorp.com/reference/ai_nail_vto
// (fetched via the `.md`-suffix trick). There is no separate "nail transfer"
// endpoint — polish/press-on is the only nail effect PerfectCorp offers.
import { createTask, getTaskStatus, withSrcFile, type SrcFileInput } from "./client";

export type NailEffectType = "nail_polish" | "press_on_nails";

// `subType`, `color`, and `texture` are all REQUIRED by the real schema
// (NailVtoNailPolishColorEffect) — none of the three were present here
// before, a real, pre-existing bug (every live call failed with
// InvalidParameters). Confirmed against the shared OpenAPI components at
// https://docs.perfectcorp.com/_bundle/reference/openapi-base.yaml.
export type NailFingerEffect = {
  finger: "thumb" | "index" | "middle" | "ring" | "pinky";
  subType?: "color" | "design";
  color: string;
  texture?: "matte" | "cream" | "jelly" | "sheer";
  reflection?: number;
  contrast?: number;
  roughness?: number;
  transparency?: number;
  shimmer?: number;
};

export type NailVtoInput = SrcFileInput & {
  effectType: NailEffectType;
  effects: NailFingerEffect[];
  refFileId?: string;
  refFileUrl?: string;
};

export async function createNailVtoTask(input: NailVtoInput): Promise<string> {
  // `version` is a REQUIRED top-level field — missing here too (the same
  // recurring class of bug as fitzpatrick/eye-color-lens' missing version),
  // caught only by actually running this for real.
  const payload: Record<string, unknown> = {
    version: "1.0",
    effect_type: input.effectType,
    effects: input.effects.map((e) => ({
      finger: e.finger,
      sub_type: e.subType ?? "color",
      color: e.color,
      texture: e.texture ?? "cream",
      reflection: e.reflection,
      contrast: e.contrast,
      roughness: e.roughness,
      transparency: e.transparency,
      shimmer: e.shimmer,
    })),
  };
  withSrcFile(payload, input, "createNailVtoTask");

  if (input.refFileId) payload.ref_file_id = input.refFileId;
  else if (input.refFileUrl) payload.ref_file_url = input.refFileUrl;

  return createTask("nail-vto", payload);
}

export type NailVtoResult = { url: string };

export async function getNailVtoStatus(taskId: string) {
  return getTaskStatus<NailVtoResult>("nail-vto", taskId);
}
