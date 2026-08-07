// AI Clothes Virtual Try-On V4 — 2 units per call.
// Schema confirmed against https://docs.perfectcorp.com/reference/ai_clothes
import { createTask, getTaskStatus } from "./client";

export type GarmentCategory = "full_body" | "lower_body" | "upper_body" | "shoes" | "auto";

export type ClothesVtoInput = {
  srcFileId?: string;
  srcFileUrl?: string;
  refFileId?: string;
  refFileUrl?: string;
  garmentCategory: GarmentCategory;
  /** Only has an effect when garmentCategory is "full_body" or "lower_body". */
  changeShoes?: boolean;
};

export async function createClothesVtoTask(input: ClothesVtoInput): Promise<string> {
  const payload: Record<string, unknown> = { garment_category: input.garmentCategory };

  if (input.srcFileId) payload.src_file_id = input.srcFileId;
  else if (input.srcFileUrl) payload.src_file_url = input.srcFileUrl;
  else throw new Error("createClothesVtoTask requires either srcFileId or srcFileUrl");

  if (input.refFileId) payload.ref_file_id = input.refFileId;
  else if (input.refFileUrl) payload.ref_file_url = input.refFileUrl;
  else throw new Error("createClothesVtoTask requires either refFileId or refFileUrl");

  if (typeof input.changeShoes === "boolean") payload.change_shoes = input.changeShoes;

  return createTask("cloth-v4", payload);
}

export type ClothesVtoResult = { url: string };

export async function getClothesVtoStatus(taskId: string) {
  return getTaskStatus<ClothesVtoResult>("cloth-v4", taskId);
}
