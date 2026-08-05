import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";

import { CustomFabricObject } from "@/types/type";

// Clears the canvas/storage and re-adds every object from a template's
// canvasJson, generating a fresh objectId per object so re-using the same
// template twice (or two different rooms loading it) never collides.
export function loadTemplateOntoCanvas({
  canvasJson,
  canvas,
  deleteAllShapes,
  syncShapeInStorage,
}: {
  canvasJson: Record<string, unknown>[];
  canvas: React.MutableRefObject<fabric.Canvas | null>;
  deleteAllShapes: () => void;
  syncShapeInStorage: (shape: fabric.Object) => void;
}) {
  if (!canvas.current) return;

  deleteAllShapes();
  canvas.current.clear();

  canvasJson.forEach((objectData) => {
    fabric.util.enlivenObjects(
      [{ ...objectData, objectId: uuidv4() }],
      (enlivened: fabric.Object[]) => {
        enlivened.forEach((obj) => {
          canvas.current!.add(obj);
          syncShapeInStorage(obj);
        });
      },
      "fabric"
    );
  });

  canvas.current.renderAll();
}

export function findEmptyPlaceholder(canvas: fabric.Canvas | null): CustomFabricObject<fabric.Object> | null {
  if (!canvas) return null;
  const match = canvas.getObjects().find((obj) => (obj as CustomFabricObject<fabric.Object>).isPlaceholder);
  return (match as CustomFabricObject<fabric.Object>) ?? null;
}

// Tag-and-swap: capture the placeholder's exact on-canvas geometry and stack
// position, remove it, and add the generated image in its place — same
// interaction model as any other image layer, no clip-masking/cropping (that's
// an explicit P1, not required for the demo).
export function dropVariantIntoPlaceholder({
  url,
  placeholder,
  canvas,
  shapeRef,
  syncShapeInStorage,
  deleteShapeFromStorage,
}: {
  url: string;
  placeholder: CustomFabricObject<fabric.Object>;
  canvas: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
  deleteShapeFromStorage: (id: string) => void;
}) {
  if (!canvas.current) return;

  const { left, top, angle, originX, originY } = placeholder;
  const targetWidth = (placeholder.width ?? 100) * (placeholder.scaleX ?? 1);
  const targetHeight = (placeholder.height ?? 100) * (placeholder.scaleY ?? 1);
  const placeholderObjectId = placeholder.objectId;
  const zIndex = canvas.current.getObjects().indexOf(placeholder);

  fabric.Image.fromURL(
    url,
    (img) => {
      img.set({ left, top, angle: angle ?? 0, originX, originY });
      img.scaleX = targetWidth / (img.width || targetWidth);
      img.scaleY = targetHeight / (img.height || targetHeight);
      (img as CustomFabricObject<fabric.Image>).objectId = uuidv4();

      canvas.current!.remove(placeholder);
      if (placeholderObjectId) deleteShapeFromStorage(placeholderObjectId);

      canvas.current!.insertAt(img, zIndex >= 0 ? zIndex : canvas.current!.getObjects().length, false);
      shapeRef.current = img;
      syncShapeInStorage(img);
      canvas.current!.requestRenderAll();
    },
    { crossOrigin: "anonymous" }
  );
}
