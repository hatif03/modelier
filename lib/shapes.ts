import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";

import {
  CustomFabricObject,
  ElementDirection,
  ImageUpload,
  InsertImageFromUrl,
  ModifyShape,
} from "@/types/type";

export const createRectangle = (pointer: PointerEvent) => {
  const rect = new fabric.Rect({
    left: pointer.x,
    top: pointer.y,
    width: 100,
    height: 100,
    fill: "#aabbcc",
    objectId: uuidv4(),
  } as CustomFabricObject<fabric.Rect>);

  return rect;
};

export const createTriangle = (pointer: PointerEvent) => {
  return new fabric.Triangle({
    left: pointer.x,
    top: pointer.y,
    width: 100,
    height: 100,
    fill: "#aabbcc",
    objectId: uuidv4(),
  } as CustomFabricObject<fabric.Triangle>);
};

export const createCircle = (pointer: PointerEvent) => {
  return new fabric.Circle({
    left: pointer.x,
    top: pointer.y,
    radius: 100,
    fill: "#aabbcc",
    objectId: uuidv4(),
  } as any);
};

export const createLine = (pointer: PointerEvent) => {
  return new fabric.Line(
    [pointer.x, pointer.y, pointer.x + 100, pointer.y + 100],
    {
      stroke: "#aabbcc",
      strokeWidth: 2,
      objectId: uuidv4(),
    } as CustomFabricObject<fabric.Line>
  );
};

export const createText = (pointer: PointerEvent, text: string) => {
  return new fabric.IText(text, {
    left: pointer.x,
    top: pointer.y,
    fill: "#aabbcc",
    fontFamily: "Helvetica",
    fontSize: 36,
    fontWeight: "400",
    objectId: uuidv4()
  } as fabric.ITextOptions);
};

export const createSpecificShape = (
  shapeType: string,
  pointer: PointerEvent
) => {
  switch (shapeType) {
    case "rectangle":
      return createRectangle(pointer);

    case "triangle":
      return createTriangle(pointer);

    case "circle":
      return createCircle(pointer);

    case "line":
      return createLine(pointer);

    case "text":
      return createText(pointer, "Tap to Type");

    default:
      return null;
  }
};

export const handleImageUpload = ({
  file,
  canvas,
  shapeRef,
  syncShapeInStorage,
}: ImageUpload) => {
  const reader = new FileReader();

  reader.onload = () => {
    fabric.Image.fromURL(reader.result as string, (img) => {
      img.scaleToWidth(200);
      img.scaleToHeight(200);

      canvas.current.add(img);

      // @ts-ignore
      img.objectId = uuidv4();

      shapeRef.current = img;

      syncShapeInStorage(img);
      canvas.current.requestRenderAll();
    });
  };

  reader.readAsDataURL(file);
};

export function loadHtmlImage(url: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// Same insertion sequence as handleImageUpload, but for a remote URL (a
// generated AI Model Studio render, a template asset, ...) instead of a local
// File — skips FileReader entirely. crossOrigin is requested first so the
// canvas stays untainted (exportToPdf's canvas.toDataURL() would otherwise
// throw once a cross-origin image is on the canvas) — but YouCam's own
// CDN has been observed intermittently serving a cache hit without CORS
// headers for the exact same URL that worked moments earlier, which silently
// breaks a plain fabric.Image.fromURL(..., {crossOrigin: "anonymous"}) call
// (the image never loads, nothing is added, no error surfaces). Loading the
// <img> ourselves first lets us detect that and fall back to a same
// non-CORS load so the image still lands on canvas — Export to PDF just
// won't work for a canvas containing this particular image.
export const insertImageFromUrl = async ({
  url,
  canvas,
  shapeRef,
  syncShapeInStorage,
}: InsertImageFromUrl) => {
  let htmlImg: HTMLImageElement;
  try {
    htmlImg = await loadHtmlImage(url, "anonymous");
  } catch {
    htmlImg = await loadHtmlImage(url);
  }

  const img = new fabric.Image(htmlImg);
  img.scaleToWidth(300);
  img.scaleToHeight(300);

  canvas.current.add(img);
  canvas.current.setActiveObject(img);

  // @ts-ignore
  img.objectId = uuidv4();

  shapeRef.current = img;

  syncShapeInStorage(img);
  canvas.current.requestRenderAll();
};

// Upload a user's own image (PNG/JPG) or vector (SVG) onto the canvas,
// centered — unlike handleImageUpload above (which is driven by the Navbar's
// image tool and leaves fabric's default 0,0 placement), this is the
// Uploads panel's entry point and both branches converge on the same
// objectId/syncShapeInStorage/requestRenderAll sequence every insertion path
// in this app already uses.
export const handleFileUpload = ({
  file,
  canvas,
  syncShapeInStorage,
}: {
  file: File;
  canvas: React.MutableRefObject<fabric.Canvas>;
  syncShapeInStorage: (shape: fabric.Object) => void;
}) => {
  const finish = (obj: fabric.Object) => {
    obj.set({
      left: canvas.current.getWidth() / 2,
      top: canvas.current.getHeight() / 2,
      originX: "center",
      originY: "center",
    });
    (obj as any).objectId = uuidv4();
    canvas.current.add(obj);
    canvas.current.setActiveObject(obj);
    syncShapeInStorage(obj);
    canvas.current.requestRenderAll();
  };

  if (file.type === "image/svg+xml") {
    const reader = new FileReader();
    reader.onload = () => {
      // fabric.js supports SVG loading at runtime (confirmed in the bundled
      // fabric.js) but @types/fabric has no declaration for it.
      (fabric as any).loadSVGFromString(reader.result as string, (objects: fabric.Object[]) => {
        const group = new fabric.Group(objects);
        group.scaleToWidth(200);
        finish(group);
      });
    };
    reader.readAsText(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    fabric.Image.fromURL(reader.result as string, (img) => {
      img.scaleToWidth(200);
      finish(img);
    });
  };
  reader.readAsDataURL(file);
};

export const createShape = (
  canvas: fabric.Canvas,
  pointer: PointerEvent,
  shapeType: string
) => {
  if (shapeType === "freeform") {
    canvas.isDrawingMode = true;
    return null;
  }

  return createSpecificShape(shapeType, pointer);
};

export const modifyShape = ({
  canvas,
  property,
  value,
  activeObjectRef,
  syncShapeInStorage,
}: ModifyShape) => {
  const selectedElement = canvas.getActiveObject();

  if (!selectedElement || selectedElement?.type === "activeSelection") return;

  // if  property is width or height, set the scale of the selected element
  if (property === "width") {
    selectedElement.set("scaleX", 1);
    selectedElement.set("width", value);
  } else if (property === "height") {
    selectedElement.set("scaleY", 1);
    selectedElement.set("height", value);
  } else if (property === "opacity") {
    // Attributes.opacity is a 0-100 string for display; fabric's own
    // opacity is 0-1.
    selectedElement.set("opacity", Number(value) / 100);
  } else {
    if (selectedElement[property as keyof object] === value) return;
    selectedElement.set(property as keyof object, value);
  }

  // set selectedElement to activeObjectRef
  activeObjectRef.current = selectedElement;

  syncShapeInStorage(selectedElement);
};

export const bringElement = ({
  canvas,
  direction,
  syncShapeInStorage,
}: ElementDirection) => {
  if (!canvas) return;

  // get the selected element. If there is no selected element or there are more than one selected element, return
  const selectedElement = canvas.getActiveObject();

  if (!selectedElement || selectedElement?.type === "activeSelection") return;

  // bring the selected element to the front
  if (direction === "front") {
    canvas.bringToFront(selectedElement);
  } else if (direction === "back") {
    canvas.sendToBack(selectedElement);
  }

  // canvas.renderAll();
  syncShapeInStorage(selectedElement);

  // re-render all objects on the canvas
};

// Fabric has no built-in "align to canvas bounds" helper (bringToFront/
// sendToBack above are its only native arrange operations) — this computes
// left/top against the canvas's own dimensions and the object's scaled
// bounding box, the same scaled-size math lib/canvas.ts already uses for
// RightSidebar's width/height display.
export const alignElement = ({
  canvas,
  alignment,
  syncShapeInStorage,
}: {
  canvas: fabric.Canvas;
  alignment: string;
  syncShapeInStorage: (shape: fabric.Object) => void;
}) => {
  if (!canvas) return;

  const selectedElement = canvas.getActiveObject();
  if (!selectedElement || selectedElement?.type === "activeSelection") return;

  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();
  const scaledWidth = selectedElement.getScaledWidth();
  const scaledHeight = selectedElement.getScaledHeight();

  switch (alignment) {
    case "left":
      selectedElement.set({ left: 0 });
      break;
    case "horizontalCenter":
      selectedElement.set({ left: (canvasWidth - scaledWidth) / 2 });
      break;
    case "right":
      selectedElement.set({ left: canvasWidth - scaledWidth });
      break;
    case "top":
      selectedElement.set({ top: 0 });
      break;
    case "verticalCenter":
      selectedElement.set({ top: (canvasHeight - scaledHeight) / 2 });
      break;
    case "bottom":
      selectedElement.set({ top: canvasHeight - scaledHeight });
      break;
    default:
      return;
  }

  selectedElement.setCoords();
  canvas.requestRenderAll();
  syncShapeInStorage(selectedElement);
};