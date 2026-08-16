// AI Makeup Virtual Try-On — 1 unit per call.
// Schema confirmed against https://docs.perfectcorp.com/reference/makeup_vto
// (the real API composes an array of typed "effects", not a single flat color —
// this wrapper exposes a simple hex-shade helper on top for the PRD's
// "select a shade" beauty flow).
import { createTask, getTaskStatus, listTemplates, type SrcFileInput } from "./client";

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

// ---- Makeup transfer — applies a reference look's makeup onto the user's
// face. Schema confirmed against https://docs.perfectcorp.com/reference/ai_makeup_transfer.
export type MakeupTransferInput = {
  srcFileId?: string;
  srcFileUrl?: string;
  refFileId?: string;
  refFileUrl?: string;
};

export async function createMakeupTransferTask(input: MakeupTransferInput): Promise<string> {
  const payload: Record<string, unknown> = {};

  if (input.srcFileId) payload.src_file_id = input.srcFileId;
  else if (input.srcFileUrl) payload.src_file_url = input.srcFileUrl;
  else throw new Error("createMakeupTransferTask requires either srcFileId or srcFileUrl");

  if (input.refFileId) payload.ref_file_id = input.refFileId;
  else if (input.refFileUrl) payload.ref_file_url = input.refFileUrl;
  else throw new Error("createMakeupTransferTask requires either refFileId or refFileUrl");

  return createTask("mu-transfer", payload);
}

export type MakeupTransferResult = { url: string };

export async function getMakeupTransferStatus(taskId: string) {
  return getTaskStatus<MakeupTransferResult>("mu-transfer", taskId);
}

// ---- AI Look VTO — applies a curated makeup-look template to a face (one
// face in, one styled face out) — NOT a full outfit combiner despite the
// endpoint's name; much closer in shape to hair.ts's template-transfer
// effects than to a multi-garment "look". Schema confirmed against
// https://docs.perfectcorp.com/_bundle/reference/ai_look_vto.yaml — single
// src photo + a required template_id, single-url result.
export async function listLookVtoTemplates() {
  return listTemplates("look-vto");
}

export type LookVtoInput = SrcFileInput & { templateId: string };

export async function createLookVtoTask(input: LookVtoInput): Promise<string> {
  const payload: Record<string, unknown> = { template_id: input.templateId };
  if (input.srcFileId) payload.src_file_id = input.srcFileId;
  else if (input.srcFileUrl) payload.src_file_url = input.srcFileUrl;
  else throw new Error("createLookVtoTask requires either srcFileId or srcFileUrl");
  return createTask("look-vto", payload);
}

export type LookVtoResult = { url: string };

export async function getLookVtoStatus(taskId: string) {
  return getTaskStatus<LookVtoResult>("look-vto", taskId);
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
