// Gem-outline and metal-color primitives for Jewelry Studio's freeform sketch mode —
// intentionally simplified approximations (this is explicitly not a CAD tool), following
// the same factory-function pattern as lib/shapes.ts's createCircle/createTriangle but
// kept in a separate module since Jewelry Studio is a deliberately separate feature.
import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";

export type GemShapeType = "round" | "oval" | "marquise" | "pear" | "emerald";

// A pale blue-white "diamond" tint with a clearly darker stroke — the previous
// near-white fill + light-grey stroke was correctly rendering (confirmed via raw pixel
// inspection) but was so low-contrast against the white canvas it read as invisible.
const GEM_FILL = "#EAF3FA";
const GEM_STROKE = "#5B6B75";

export function createGemShape(type: GemShapeType, pointer: { x: number; y: number }): fabric.Object {
  const common = { left: pointer.x, top: pointer.y, fill: GEM_FILL, stroke: GEM_STROKE, strokeWidth: 2.5, objectId: uuidv4() } as any;

  switch (type) {
    case "round":
      return new fabric.Circle({ ...common, radius: 40 });

    case "oval":
      return new fabric.Ellipse({ ...common, rx: 40, ry: 26 });

    case "emerald":
      // Approximated as a rounded rectangle rather than a true cut-corner octagon —
      // a reasonable simplification for a non-CAD sketch tool.
      return new fabric.Rect({ ...common, width: 70, height: 48, rx: 6, ry: 6 });

    case "marquise":
      return new fabric.Path("M 0 40 C 0 15 25 0 50 0 C 75 0 100 15 100 40 C 100 65 75 80 50 80 C 25 80 0 65 0 40 Z", {
        ...common,
        scaleY: 0.55,
      });

    case "pear":
      return new fabric.Path(
        "M 50 0 C 75 20 90 45 90 65 C 90 85 70 100 50 100 C 30 100 10 85 10 65 C 10 45 25 20 50 0 Z",
        { ...common, scaleX: 0.7, scaleY: 0.7 }
      );

    default:
      return new fabric.Circle({ ...common, radius: 40 });
  }
}

export type MetalSwatch = { label: string; hex: string };

export const METAL_SWATCHES: MetalSwatch[] = [
  { label: "Gold", hex: "#D4AF37" },
  { label: "Rose gold", hex: "#B76E79" },
  { label: "Silver", hex: "#C0C0C0" },
  { label: "White gold", hex: "#E8E4DA" },
];
