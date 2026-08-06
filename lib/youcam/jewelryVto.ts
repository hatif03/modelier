// AI Ring / Necklace / Earrings / Bracelet / Watch Virtual Try-On.
//
// UNCONFIRMED SCHEMA — unlike clothesVto.ts/makeupVto.ts, these five feature slugs and
// payload shapes have NOT been checked against the live docs.perfectcorp.com reference
// pages or the API Playground (that reference is a JS-rendered SPA that couldn't be
// scraped during planning). Perfect Corp's public marketing pages confirm each API
// takes a person photo (src) showing the relevant body part and a 2D product photo of
// the jewelry item on a clear background (ref) — the same src/ref shape clothesVto.ts
// already uses — so that much is a reasonable bet. Everything else (the exact feature
// slug string, category-specific fields like a necklace anchor point or lighting
// config, and the response/error shape) is a placeholder. Confirm against the live API
// before shipping, and update only the affected function if one category's real schema
// differs — that's the point of keeping these five isolated instead of one shared call.
import { createTask, getTaskStatus } from "./client";

export type JewelryCategory = "ring" | "necklace" | "earring" | "bracelet" | "watch";

export const JEWELRY_FEATURE_SLUGS: Record<JewelryCategory, string> = {
  ring: "ring-vto",
  necklace: "necklace-vto",
  earring: "earring-vto",
  bracelet: "bracelet-vto",
  watch: "watch-vto",
};

export type JewelryVtoInput = {
  srcFileId?: string;
  srcFileUrl?: string;
  refFileId?: string;
  refFileUrl?: string;
};

export type JewelryVtoResult = { url: string };

function buildPayload(input: JewelryVtoInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.srcFileId) payload.src_file_id = input.srcFileId;
  else if (input.srcFileUrl) payload.src_file_url = input.srcFileUrl;
  else throw new Error("Jewelry VTO requires either srcFileId or srcFileUrl");

  if (input.refFileId) payload.ref_file_id = input.refFileId;
  else if (input.refFileUrl) payload.ref_file_url = input.refFileUrl;
  else throw new Error("Jewelry VTO requires either refFileId or refFileUrl");

  return payload;
}

export async function createRingVtoTask(input: JewelryVtoInput): Promise<string> {
  return createTask(JEWELRY_FEATURE_SLUGS.ring, buildPayload(input));
}

export async function getRingVtoStatus(taskId: string) {
  return getTaskStatus<JewelryVtoResult>(JEWELRY_FEATURE_SLUGS.ring, taskId);
}

export async function createNecklaceVtoTask(input: JewelryVtoInput): Promise<string> {
  return createTask(JEWELRY_FEATURE_SLUGS.necklace, buildPayload(input));
}

export async function getNecklaceVtoStatus(taskId: string) {
  return getTaskStatus<JewelryVtoResult>(JEWELRY_FEATURE_SLUGS.necklace, taskId);
}

export async function createEarringVtoTask(input: JewelryVtoInput): Promise<string> {
  return createTask(JEWELRY_FEATURE_SLUGS.earring, buildPayload(input));
}

export async function getEarringVtoStatus(taskId: string) {
  return getTaskStatus<JewelryVtoResult>(JEWELRY_FEATURE_SLUGS.earring, taskId);
}

export async function createBraceletVtoTask(input: JewelryVtoInput): Promise<string> {
  return createTask(JEWELRY_FEATURE_SLUGS.bracelet, buildPayload(input));
}

export async function getBraceletVtoStatus(taskId: string) {
  return getTaskStatus<JewelryVtoResult>(JEWELRY_FEATURE_SLUGS.bracelet, taskId);
}

export async function createWatchVtoTask(input: JewelryVtoInput): Promise<string> {
  return createTask(JEWELRY_FEATURE_SLUGS.watch, buildPayload(input));
}

export async function getWatchVtoStatus(taskId: string) {
  return getTaskStatus<JewelryVtoResult>(JEWELRY_FEATURE_SLUGS.watch, taskId);
}

const CREATE_TASK_BY_CATEGORY: Record<JewelryCategory, (input: JewelryVtoInput) => Promise<string>> = {
  ring: createRingVtoTask,
  necklace: createNecklaceVtoTask,
  earring: createEarringVtoTask,
  bracelet: createBraceletVtoTask,
  watch: createWatchVtoTask,
};

const GET_STATUS_BY_CATEGORY: Record<JewelryCategory, (taskId: string) => ReturnType<typeof getTaskStatus<JewelryVtoResult>>> = {
  ring: getRingVtoStatus,
  necklace: getNecklaceVtoStatus,
  earring: getEarringVtoStatus,
  bracelet: getBraceletVtoStatus,
  watch: getWatchVtoStatus,
};

export function createJewelryVtoTask(category: JewelryCategory, input: JewelryVtoInput): Promise<string> {
  return CREATE_TASK_BY_CATEGORY[category](input);
}

export function getJewelryVtoStatus(category: JewelryCategory, taskId: string) {
  return GET_STATUS_BY_CATEGORY[category](taskId);
}

export function jewelryFeatureToCategory(feature: string): JewelryCategory | undefined {
  return (Object.entries(JEWELRY_FEATURE_SLUGS).find(([, slug]) => slug === feature)?.[0] as JewelryCategory) ?? undefined;
}

// Which ReferenceModelPose.pose value each category needs (see
// scripts/seed-reference-model-poses.ts). Necklace/earring reuse the full-body shot
// directly instead of a pose row — see resolveJewelrySrc in app/api/generations/route.ts.
export const POSE_BY_CATEGORY: Record<JewelryCategory, "hand" | "wrist" | "neck_ears" | null> = {
  ring: "hand",
  bracelet: "wrist",
  watch: "wrist",
  necklace: null,
  earring: null,
};
