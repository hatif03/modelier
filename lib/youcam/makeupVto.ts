// AI Makeup Virtual Try-On — 1 unit per call.
// Schema confirmed against https://docs.perfectcorp.com/reference/makeup_vto
// (the real API composes an array of typed "effects", not a single flat color —
// this wrapper exposes a simple hex-shade helper on top for the PRD's
// "select a shade" beauty flow).
import { createTask, getTaskStatus } from "./client";

export type LipColorEffect = {
  category: "lip_color";
  shape: { name: string };
  style: { type: "full" | "ombre" | "twoTone"; innerColorRatio?: number; blendStrength?: number };
  palettes: Array<{
    color: string;
    texture: "matte" | "gloss" | "holographic" | "metallic" | "satin" | "sheer" | "shimmer";
    colorIntensity: number;
    gloss?: number;
    transparencyIntensity?: number;
  }>;
  morphology?: { fullness?: number; wrinkless?: number };
};

export type FoundationEffect = {
  category: "foundation";
  palettes: Array<{ color: string; colorIntensity: number; glowIntensity: number; coverageIntensity: number }>;
};

export type MakeupEffect = LipColorEffect | FoundationEffect;

export type MakeupVtoInput = {
  srcFileId?: string;
  srcFileUrl?: string;
  effects: MakeupEffect[];
};

export async function createMakeupVtoTask(input: MakeupVtoInput): Promise<string> {
  const payload: Record<string, unknown> = { effects: input.effects };

  if (input.srcFileId) payload.src_file_id = input.srcFileId;
  else if (input.srcFileUrl) payload.src_file_url = input.srcFileUrl;
  else throw new Error("createMakeupVtoTask requires either srcFileId or srcFileUrl");

  return createTask("makeup-vto", payload);
}

export type MakeupVtoResult = { url: string };

export async function getMakeupVtoStatus(taskId: string) {
  return getTaskStatus<MakeupVtoResult>("makeup-vto", taskId);
}

// A single lip-color effect from just a hex shade — the PRD's "select a
// shade" beauty flow, no per-property makeup UI needed. "original" as the lip
// shape name is an unmodified-shape default; confirm against the live API
// Playground if it ever errors with an invalid-shape message.
export function lipColorEffectFromShade(hex: string): LipColorEffect {
  return {
    category: "lip_color",
    shape: { name: "original" },
    style: { type: "full" },
    palettes: [{ color: hex, texture: "satin", colorIntensity: 80 }],
  };
}
