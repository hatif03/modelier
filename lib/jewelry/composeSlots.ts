// Configurator compositing — each jewelry category defines fixed part "slots"
// (JewelryPartOption.slot), and picking an option for a slot places that option's image
// at the slot's exact position/size on a local (non-Liveblocks, single-user) fabric
// canvas, replacing whatever was there before. Conceptually the same insert-and-scale
// idea as lib/templates.ts's dropVariantIntoPlaceholder, just applied per-slot instead
// of swapping one placeholder — kept as its own module since Jewelry Studio is a
// deliberately separate feature from the marketing canvas.
import { fabric } from "fabric";

import { loadHtmlImage } from "@/lib/shapes";

export type Slot = { left: number; top: number; width: number; height: number };

// Same CORS-fallback loader lib/templates.ts's dropVariantIntoPlaceholder already
// relies on for YouCam-hosted images — here it also has to work for arbitrary
// part-asset hosts, so the same defensive fallback applies.
async function loadImage(url: string): Promise<HTMLImageElement> {
  try {
    return await loadHtmlImage(url, "anonymous");
  } catch {
    return await loadHtmlImage(url);
  }
}

// Tracks which fabric.Image currently occupies each partType's slot, so re-selecting a
// different option for the same part replaces it instead of stacking duplicates.
export type SlotObjects = Map<string, fabric.Image>;

export async function setSlotImage({
  canvas,
  partType,
  slot,
  imageUrl,
  slotObjects,
}: {
  canvas: fabric.Canvas;
  partType: string;
  slot: Slot;
  imageUrl: string;
  slotObjects: SlotObjects;
}): Promise<void> {
  const htmlImg = await loadImage(imageUrl);

  const img = new fabric.Image(htmlImg, { left: slot.left, top: slot.top, selectable: false, evented: false });
  img.scaleX = slot.width / (img.width || slot.width);
  img.scaleY = slot.height / (img.height || slot.height);

  const previous = slotObjects.get(partType);
  if (previous) canvas.remove(previous);

  canvas.add(img);
  slotObjects.set(partType, img);
  canvas.requestRenderAll();
}

export function clearSlot(canvas: fabric.Canvas, partType: string, slotObjects: SlotObjects): void {
  const previous = slotObjects.get(partType);
  if (!previous) return;
  canvas.remove(previous);
  slotObjects.delete(partType);
  canvas.requestRenderAll();
}
