// AI Nail VTO (polish or press-on-nail effects, per-finger config). Schema
// confirmed against https://docs.perfectcorp.com/reference/ai_nail_vto
// (fetched via the `.md`-suffix trick). There is no separate "nail transfer"
// endpoint — polish/press-on is the only nail effect PerfectCorp offers.
import { createTask, getTaskStatus, withSrcFile, type SrcFileInput } from "./client";

export type NailEffectType = "nail_polish" | "press_on_nails";

export type NailFingerEffect = {
  finger: "thumb" | "index" | "middle" | "ring" | "pinky";
  subType?: string;
  texture?: string;
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
  const payload: Record<string, unknown> = {
    effect_type: input.effectType,
    effects: input.effects.map((e) => ({
      finger: e.finger,
      sub_type: e.subType,
      texture: e.texture,
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
