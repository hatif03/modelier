import { fabric } from "fabric";

import { CustomFabricObject } from "@/types/type";

// Scale-to-fit + center, never stretch/distort — same-aspect targets (most
// social formats share the source's proportions) end up filling the new
// canvas almost exactly; a very different aspect ratio just gets letterboxed
// margin rather than warped artwork. AI-assisted reflow for a genuinely
// different layout is a future enhancement, not this pass.
export function buildResizedCanvasJson(
  objects: fabric.Object[],
  from: { width: number; height: number },
  to: { width: number; height: number }
): Record<string, unknown>[] {
  const scale = Math.min(to.width / from.width, to.height / from.height);
  const offsetX = (to.width - from.width * scale) / 2;
  const offsetY = (to.height - from.height * scale) / 2;

  return objects.map((obj) => {
    const data = obj.toJSON() as Record<string, unknown>;
    const custom = obj as CustomFabricObject<fabric.Object>;
    data.objectId = custom.objectId;
    if (custom.isPlaceholder) {
      data.isPlaceholder = true;
      data.placeholderId = custom.placeholderId;
    }

    const left = typeof data.left === "number" ? data.left : 0;
    const top = typeof data.top === "number" ? data.top : 0;
    const scaleX = typeof data.scaleX === "number" ? data.scaleX : 1;
    const scaleY = typeof data.scaleY === "number" ? data.scaleY : 1;

    data.left = left * scale + offsetX;
    data.top = top * scale + offsetY;
    data.scaleX = scaleX * scale;
    data.scaleY = scaleY * scale;

    return data;
  });
}
