import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";

// A symmetric N-point star/burst, alternating outer/inner vertices around
// (50,50) in a 100x100 box — the same path string drives both the fabric
// object inserted onto the canvas and the <svg> preview in the panel button,
// so the two can never drift out of sync.
const buildStarPath = (points: number, outerRadius: number, innerRadius: number) => {
  const cx = 50;
  const cy = 50;
  const step = Math.PI / points;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d + "Z";
};

export type IconId = "star" | "burst" | "heart" | "tag";

export const ICON_DEFS: { id: IconId; label: string; path: string; viewBox: string }[] = [
  { id: "star", label: "Star", path: buildStarPath(5, 48, 19), viewBox: "0 0 100 100" },
  { id: "burst", label: "Sale burst", path: buildStarPath(14, 48, 36), viewBox: "0 0 100 100" },
  {
    id: "heart",
    label: "Heart",
    path: "M 50,18 C 35,-4 0,4 0,32 C 0,60 50,88 50,88 C 50,88 100,60 100,32 C 100,4 65,-4 50,18 Z",
    viewBox: "0 0 100 88",
  },
  {
    // A pentagon "tag" body (a rectangle with a point on the left) plus a
    // punch-hole near the tip — built as a fabric.Group below, not a single
    // path, since the hole needs to actually cut through, not just overlay.
    id: "tag",
    label: "Price tag",
    path: "M 0 30 L 32 0 L 100 0 L 100 60 L 32 60 Z",
    viewBox: "0 0 100 60",
  },
];

export const buildIconObject = (id: IconId, fill: string): fabric.Object => {
  const def = ICON_DEFS.find((d) => d.id === id)!;

  if (id === "tag") {
    const body = new fabric.Path(def.path, { fill });
    const hole = new fabric.Circle({
      left: 40,
      top: 24,
      radius: 6,
      fill: "#000000",
      // Composited within the group's own off-screen render, this erases
      // the covered pixels of `body` beneath it — a real cut hole, not a
      // same-colored circle hoping to look like one. Missing from
      // @types/fabric despite being a real fabric.Object property.
      globalCompositeOperation: "destination-out",
    } as any);
    return new fabric.Group([body, hole], { objectId: uuidv4() } as any);
  }

  return new fabric.Path(def.path, { fill, objectId: uuidv4() } as any);
};

export const insertIconOnCanvas = ({
  id,
  fill,
  canvas,
  syncShapeInStorage,
}: {
  id: IconId;
  fill: string;
  canvas: fabric.Canvas;
  syncShapeInStorage: (shape: fabric.Object) => void;
}) => {
  const obj = buildIconObject(id, fill);
  obj.scaleToWidth(90);
  obj.set({
    left: canvas.getWidth() / 2,
    top: canvas.getHeight() / 2,
    originX: "center",
    originY: "center",
  });
  if (!(obj as any).objectId) (obj as any).objectId = uuidv4();

  canvas.add(obj);
  canvas.setActiveObject(obj);
  syncShapeInStorage(obj);
  canvas.requestRenderAll();
};
