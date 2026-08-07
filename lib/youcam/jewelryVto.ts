// AI Ring / Necklace / Earrings / Bracelet / Watch Virtual Try-On.
//
// Confirmed against the live docs.perfectcorp.com reference pages (via the
// `.md`-suffix trick — these are JS-rendered SPA pages that return only a
// title without it). Unlike every other YouCam feature, jewelry VTO nests
// under `2d-vto/{category}` rather than a flat `{category}-vto` slug:
//   POST/GET /s2s/v2.0/task/2d-vto/{ring|necklace|earring|bracelet|watch}
// `createTask`/`getTaskStatus` just interpolate the feature string into the
// URL, so passing the nested segment through as one string is enough — no
// separate "path shape" concept needed in client.ts.
import { createTask, getTaskStatus } from "./client";

export type JewelryCategory = "ring" | "necklace" | "earring" | "bracelet" | "watch";

export const JEWELRY_FEATURE_SLUGS: Record<JewelryCategory, string> = {
  ring: "2d-vto/ring",
  necklace: "2d-vto/necklace",
  earring: "2d-vto/earring",
  bracelet: "2d-vto/bracelet",
  watch: "2d-vto/watch",
};

export type RingFinger = "thumb" | "index" | "middle" | "ring" | "pinky";

// API indexes fingers 0-4 (thumb..pinky) — the only jewelry category where
// placement is a required parameter, not an optional tuning knob, since it
// determines which finger the ring renders on.
const RING_FINGER_INDEX: Record<RingFinger, number> = {
  thumb: 0,
  index: 1,
  middle: 2,
  ring: 3,
  pinky: 4,
};

export type JewelryVtoInput = {
  srcFileId?: string;
  srcFileUrl?: string;
  refFileId?: string;
  refFileUrl?: string;
  // Required for the ring category only; ignored otherwise.
  ringFinger?: RingFinger;
  ringWearingLocation?: number;
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

function buildRingPayload(input: JewelryVtoInput): Record<string, unknown> {
  return {
    ...buildPayload(input),
    ring_wearing_finger: RING_FINGER_INDEX[input.ringFinger ?? "ring"],
    ring_wearing_location: input.ringWearingLocation ?? 0.5,
  };
}

export async function createRingVtoTask(input: JewelryVtoInput): Promise<string> {
  return createTask(JEWELRY_FEATURE_SLUGS.ring, buildRingPayload(input));
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
