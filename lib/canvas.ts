import { fabric } from "fabric";
import { v4 as uuid4 } from "uuid";

import {
  CanvasMouseDown,
  CanvasMouseMove,
  CanvasMouseUp,
  CanvasObjectModified,
  CanvasObjectScaling,
  CanvasPathCreated,
  CanvasSelectionCreated,
  CanvasSelectionCleared,
  RenderCanvas,
} from "@/types/type";
import { defaultNavElement } from "@/constants";
import { createSpecificShape } from "./shapes";

// initialize fabric canvas at a fixed page size (the project's chosen format)
// — a Canva-style bounded page, not a canvas that fills whatever the window
// happens to be, so it never resizes on window resize either (see the removed
// handleResize — a fixed page shouldn't reflow when the browser window does).
export const initializeFabric = ({
  fabricRef,
  canvasRef,
  width,
  height,
}: {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
}) => {
  // create fabric canvas
  const canvas = new fabric.Canvas(canvasRef.current, {
    width,
    height,
  });

  // set canvas reference to fabricRef so we can use it later anywhere outside canvas listener
  fabricRef.current = canvas;

  return canvas;
};

// instantiate creation of custom fabric object/shape and add it to canvas
export const handleCanvasMouseDown = ({
  options,
  canvas,
  selectedShapeRef,
  isDrawing,
  shapeRef,
}: CanvasMouseDown) => {
  // get pointer coordinates
  const pointer = canvas.getPointer(options.e);

  /**
   * get target object i.e., the object that is clicked
   * findtarget() returns the object that is clicked
   *
   * findTarget: http://fabricjs.com/docs/fabric.Canvas.html#findTarget
   */
  const target = canvas.findTarget(options.e, false);

  // set canvas drawing mode to false
  canvas.isDrawingMode = false;

  // if selected shape is freeform, set drawing mode to true and return
  if (selectedShapeRef.current === "freeform") {
    isDrawing.current = true;
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = 5;
    return;
  }

  canvas.isDrawingMode = false;

  // if target is the selected shape or active selection, set isDrawing to false
  if (
    target &&
    (target.type === selectedShapeRef.current ||
      target.type === "activeSelection")
  ) {
    isDrawing.current = false;

    // set active object to target
    canvas.setActiveObject(target);

    /**
     * setCoords() is used to update the controls of the object
     * setCoords: http://fabricjs.com/docs/fabric.Object.html#setCoords
     */
    target.setCoords();
  } else {
    isDrawing.current = true;

    // create custom fabric object/shape and set it to shapeRef
    shapeRef.current = createSpecificShape(
      selectedShapeRef.current,
      pointer as any
    );

    // if shapeRef is not null, add it to canvas
    if (shapeRef.current) {
      // add: http://fabricjs.com/docs/fabric.Canvas.html#add
      canvas.add(shapeRef.current);
    }
  }
};

// handle mouse move event on canvas to draw shapes with different dimensions
export const handleCanvaseMouseMove = ({
  options,
  canvas,
  isDrawing,
  selectedShapeRef,
  shapeRef,
  syncShapeInStorage,
}: CanvasMouseMove) => {
  // if selected shape is freeform, return
  if (!isDrawing.current) return;
  if (selectedShapeRef.current === "freeform") return;

  canvas.isDrawingMode = false;

  // get pointer coordinates
  const pointer = canvas.getPointer(options.e);

  // depending on the selected shape, set the dimensions of the shape stored in shapeRef in previous step of handelCanvasMouseDown
  // calculate shape dimensions based on pointer coordinates
  switch (selectedShapeRef?.current) {
    case "rectangle":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });
      break;

    case "circle":
      shapeRef.current.set({
        radius: Math.abs(pointer.x - (shapeRef.current?.left || 0)) / 2,
      });
      break;

    case "triangle":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });
      break;

    case "line":
      shapeRef.current?.set({
        x2: pointer.x,
        y2: pointer.y,
      });
      break;

    case "image":
      shapeRef.current?.set({
        width: pointer.x - (shapeRef.current?.left || 0),
        height: pointer.y - (shapeRef.current?.top || 0),
      });

    default:
      break;
  }

  // render objects on canvas
  // renderAll: http://fabricjs.com/docs/fabric.Canvas.html#renderAll
  canvas.renderAll();

  // sync shape in storage
  if (shapeRef.current?.objectId) {
    syncShapeInStorage(shapeRef.current);
  }
};

// handle mouse up event on canvas to stop drawing shapes
export const handleCanvasMouseUp = ({
  canvas,
  isDrawing,
  shapeRef,
  activeObjectRef,
  selectedShapeRef,
  syncShapeInStorage,
  setActiveElement,
}: CanvasMouseUp) => {
  isDrawing.current = false;
  clearAlignmentGuides(canvas);
  canvas.requestRenderAll();
  if (selectedShapeRef.current === "freeform") return;

  // sync shape in storage as drawing is stopped
  syncShapeInStorage(shapeRef.current);

  // set everything to null
  shapeRef.current = null;
  activeObjectRef.current = null;
  selectedShapeRef.current = null;

  // if canvas is not in drawing mode, set active element to default nav element after 700ms
  if (!canvas.isDrawingMode) {
    setTimeout(() => {
      setActiveElement(defaultNavElement);
    }, 700);
  }
};

// update shape in storage when object is modified
export const handleCanvasObjectModified = ({
  options,
  syncShapeInStorage,
}: CanvasObjectModified) => {
  const target = options.target;
  if (!target) return;

  if (target?.type == "activeSelection") {
    // fix this
  } else {
    syncShapeInStorage(target);
  }
};

// update shape in storage when path is created when in freeform mode
export const handlePathCreated = ({
  options,
  syncShapeInStorage,
}: CanvasPathCreated) => {
  // get path object
  const path = options.path;
  if (!path) return;

  // set unique id to path object
  path.set({
    objectId: uuid4(),
  });

  // sync shape in storage
  syncShapeInStorage(path);
};

// Live alignment/snap guides — Canva-style dashed guide lines that appear
// while dragging an object near the canvas center or another object's
// edges/center, and snap the drag to that position within a small pixel
// threshold. Guide lines are plain fabric.Line objects tagged with
// `data.isAlignmentGuide` so they're excluded from hit-testing, storage sync
// (nothing syncs objects it didn't explicitly create), and from acting as
// snap targets for each other.
const SNAP_THRESHOLD = 6;

const getAlignmentGuideColor = () => {
  if (typeof document === "undefined") return "#c06f54";
  const value = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  return value ? `hsl(${value})` : "#c06f54";
};

export const clearAlignmentGuides = (canvas: fabric.Canvas) => {
  canvas
    .getObjects()
    .filter((object: any) => object.data?.isAlignmentGuide)
    .forEach((guide) => canvas.remove(guide));
};

const addAlignmentGuide = (canvas: fabric.Canvas, coords: [number, number, number, number]) => {
  const guide = new fabric.Line(coords, {
    stroke: getAlignmentGuideColor(),
    strokeWidth: 1,
    strokeDashArray: [4, 4],
    selectable: false,
    evented: false,
    excludeFromExport: true,
  });
  (guide as any).data = { isAlignmentGuide: true };
  canvas.add(guide);
  canvas.bringToFront(guide);
};

type Edges = { left: number; right: number; top: number; bottom: number; centerX: number; centerY: number };

const edgesOf = (object: fabric.Object): Edges => {
  const left = object.left || 0;
  const top = object.top || 0;
  const width = object.getScaledWidth();
  const height = object.getScaledHeight();
  return { left, right: left + width, top, bottom: top + height, centerX: left + width / 2, centerY: top + height / 2 };
};

// check how object is moving on canvas, restrict it to canvas boundaries, and
// snap it to the canvas center or nearby objects' edges/centers
export const handleCanvasObjectMoving = ({
  options,
}: {
  options: fabric.IEvent;
}) => {
  // get target object which is moving
  const target = options.target as fabric.Object;

  // target.canvas is the canvas on which the object is moving
  const canvas = target.canvas as fabric.Canvas;

  // set coordinates of target object
  target.setCoords();

  // restrict object to canvas boundaries (horizontal)
  if (target && target.left) {
    target.left = Math.max(
      0,
      Math.min(
        target.left,
        (canvas.width || 0) - (target.getScaledWidth() || target.width || 0)
      )
    );
  }

  // restrict object to canvas boundaries (vertical)
  if (target && target.top) {
    target.top = Math.max(
      0,
      Math.min(
        target.top,
        (canvas.height || 0) - (target.getScaledHeight() || target.height || 0)
      )
    );
  }

  clearAlignmentGuides(canvas);

  const canvasWidth = canvas.width || 0;
  const canvasHeight = canvas.height || 0;
  const targetEdges = edgesOf(target);

  let snapX: number | null = null;
  let snapY: number | null = null;

  // snap to canvas center (horizontal + vertical)
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;
  if (Math.abs(targetEdges.centerX - canvasCenterX) < SNAP_THRESHOLD) {
    snapX = canvasCenterX - (targetEdges.right - targetEdges.left) / 2;
    addAlignmentGuide(canvas, [canvasCenterX, 0, canvasCenterX, canvasHeight]);
  }
  if (Math.abs(targetEdges.centerY - canvasCenterY) < SNAP_THRESHOLD) {
    snapY = canvasCenterY - (targetEdges.bottom - targetEdges.top) / 2;
    addAlignmentGuide(canvas, [0, canvasCenterY, canvasWidth, canvasCenterY]);
  }

  // snap to other objects' edges/centers
  const others = canvas.getObjects().filter((object: any) => object !== target && !object.data?.isAlignmentGuide);
  for (const other of others) {
    const otherEdges = edgesOf(other);
    const width = targetEdges.right - targetEdges.left;
    const height = targetEdges.bottom - targetEdges.top;

    if (snapX === null) {
      const xMatches: Array<[number, number]> = [
        [targetEdges.left, otherEdges.left],
        [targetEdges.right, otherEdges.right],
        [targetEdges.centerX, otherEdges.centerX],
        [targetEdges.left, otherEdges.right],
        [targetEdges.right, otherEdges.left],
      ];
      for (const [edge, ref] of xMatches) {
        if (Math.abs(edge - ref) < SNAP_THRESHOLD) {
          snapX = target.left! + (ref - edge);
          const guideTop = Math.min(targetEdges.top, otherEdges.top) - 20;
          const guideBottom = Math.max(targetEdges.bottom, otherEdges.bottom) + 20;
          addAlignmentGuide(canvas, [ref, guideTop, ref, guideBottom]);
          break;
        }
      }
    }

    if (snapY === null) {
      const yMatches: Array<[number, number]> = [
        [targetEdges.top, otherEdges.top],
        [targetEdges.bottom, otherEdges.bottom],
        [targetEdges.centerY, otherEdges.centerY],
        [targetEdges.top, otherEdges.bottom],
        [targetEdges.bottom, otherEdges.top],
      ];
      for (const [edge, ref] of yMatches) {
        if (Math.abs(edge - ref) < SNAP_THRESHOLD) {
          snapY = target.top! + (ref - edge);
          const guideLeft = Math.min(targetEdges.left, otherEdges.left) - 20;
          const guideRight = Math.max(targetEdges.right, otherEdges.right) + 20;
          addAlignmentGuide(canvas, [guideLeft, ref, guideRight, ref]);
          break;
        }
      }
    }
  }

  if (snapX !== null) target.set({ left: snapX });
  if (snapY !== null) target.set({ top: snapY });
  target.setCoords();
};

// set element attributes when element is selected
export const handleCanvasSelectionCreated = ({
  options,
  isEditingRef,
  setElementAttributes,
}: CanvasSelectionCreated) => {
  // if user is editing manually, return
  if (isEditingRef.current) return;

  // if no element is selected, return
  if (!options?.selected) return;

  // get the selected element
  const selectedElement = options?.selected[0] as fabric.Object;

  // if only one element is selected, set element attributes
  if (selectedElement && options.selected.length === 1) {
    // calculate scaled dimensions of the object
    const scaledWidth = selectedElement?.scaleX
      ? selectedElement?.width! * selectedElement?.scaleX
      : selectedElement?.width;

    const scaledHeight = selectedElement?.scaleY
      ? selectedElement?.height! * selectedElement?.scaleY
      : selectedElement?.height;

    setElementAttributes({
      type: selectedElement?.type ?? null,
      width: scaledWidth?.toFixed(0).toString() || "",
      height: scaledHeight?.toFixed(0).toString() || "",
      fill: selectedElement?.fill?.toString() || "",
      stroke: selectedElement?.stroke || "",
      opacity:
        selectedElement?.opacity !== undefined
          ? Math.round(selectedElement.opacity * 100).toString()
          : "100",
      // @ts-ignore
      fontSize: selectedElement?.fontSize || "",
      // @ts-ignore
      fontFamily: selectedElement?.fontFamily || "",
      // @ts-ignore
      fontWeight: selectedElement?.fontWeight || "",
    });
  }
};

// clears RightSidebar's attributes when the selection is deselected — without
// this, the panel keeps showing the last-selected object's stale values (or,
// on first load, the hardcoded initial defaults) as if they described a real
// current selection.
export const handleCanvasSelectionCleared = ({
  isEditingRef,
  setElementAttributes,
}: CanvasSelectionCleared) => {
  if (isEditingRef.current) return;

  setElementAttributes({
    type: null,
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "",
    stroke: "",
    opacity: "",
  });
};

// update element attributes when element is scaled
export const handleCanvasObjectScaling = ({
  options,
  setElementAttributes,
}: CanvasObjectScaling) => {
  const selectedElement = options.target;

  // calculate scaled dimensions of the object
  const scaledWidth = selectedElement?.scaleX
    ? selectedElement?.width! * selectedElement?.scaleX
    : selectedElement?.width;

  const scaledHeight = selectedElement?.scaleY
    ? selectedElement?.height! * selectedElement?.scaleY
    : selectedElement?.height;

  setElementAttributes((prev) => ({
    ...prev,
    width: scaledWidth?.toFixed(0).toString() || "",
    height: scaledHeight?.toFixed(0).toString() || "",
  }));
};

// render canvas objects coming from storage on canvas
export const renderCanvas = ({
  fabricRef,
  canvasObjects,
  activeObjectRef,
}: RenderCanvas) => {
  // clear canvas
  fabricRef.current?.clear();

  // render all objects on canvas
  Array.from(canvasObjects, ([objectId, objectData]) => {
    /**
     * enlivenObjects() is used to render objects on canvas.
     * It takes two arguments:
     * 1. objectData: object data to render on canvas
     * 2. callback: callback function to execute after rendering objects
     * on canvas
     *
     * enlivenObjects: http://fabricjs.com/docs/fabric.util.html#.enlivenObjectEnlivables
     */
    fabric.util.enlivenObjects(
      [objectData],
      (enlivenedObjects: fabric.Object[]) => {
        enlivenedObjects.forEach((enlivenedObj) => {
          // if element is active, keep it in active state so that it can be edited further
          if (activeObjectRef.current?.objectId === objectId) {
            fabricRef.current?.setActiveObject(enlivenedObj);
          }

          // add object to canvas
          fabricRef.current?.add(enlivenedObj);
        });
      },
      /**
       * specify namespace of the object for fabric to render it on canvas
       * A namespace is a string that is used to identify the type of
       * object.
       *
       * Fabric Namespace: http://fabricjs.com/docs/fabric.html
       */
      "fabric"
    );
  });

  fabricRef.current?.renderAll();
};

// Zoom is a CSS transform: scale(zoom) on the page wrapper in Live.tsx, not
// fabric's own internal viewport — a fixed-size fabric canvas rescaled via
// canvas.zoomToPoint() never visually grows or shrinks the on-screen page,
// only the content inside it, which is why the old approach felt like an
// infinite canvas rather than a bounded, Canva-style page. Fabric's own zoom
// stays at 1 forever; its getPointer() already computes a cssScale factor
// from getBoundingClientRect() vs the canvas's internal pixel size, so mouse
// hit-testing keeps working correctly under a CSS-scaled canvas with no
// extra coordinate math needed here.
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3;

export const clampZoom = (zoom: number) => Math.min(Math.max(MIN_ZOOM, zoom), MAX_ZOOM);

const WHEEL_ZOOM_STEP = 0.001;

export const zoomByWheelDelta = (currentZoom: number, deltaY: number) =>
  clampZoom(currentZoom - deltaY * WHEEL_ZOOM_STEP);

// zoom canvas on mouse scroll — purely arithmetic, no fabric canvas API
// calls; the caller applies the returned value as CSS state.
export const handleCanvasZoom = (options: fabric.IEvent & { e: WheelEvent }, currentZoom: number) => {
  options.e.preventDefault();
  options.e.stopPropagation();
  return zoomByWheelDelta(currentZoom, options.e.deltaY);
};
