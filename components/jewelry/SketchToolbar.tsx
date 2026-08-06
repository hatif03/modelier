"use client";

import { fabric } from "fabric";
import { v4 as uuidv4 } from "uuid";

import { createGemShape, METAL_SWATCHES, type GemShapeType } from "@/lib/jewelry/gemShapes";

const GEM_SHAPES: { id: GemShapeType; label: string }[] = [
  { id: "round", label: "Round" },
  { id: "oval", label: "Oval" },
  { id: "marquise", label: "Marquise" },
  { id: "pear", label: "Pear" },
  { id: "emerald", label: "Emerald-cut" },
];

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
};

const CANVAS_CENTER = 240;

const SketchToolbar = ({ fabricRef }: Props) => {
  const addGem = (type: GemShapeType) => {
    if (!fabricRef.current) return;
    const shape = createGemShape(type, { x: CANVAS_CENTER - 40, y: CANVAS_CENTER - 40 });
    fabricRef.current.add(shape);
    fabricRef.current.setActiveObject(shape);
    fabricRef.current.requestRenderAll();
  };

  const addArc = () => {
    if (!fabricRef.current) return;
    const arc = new fabric.Circle({
      left: CANVAS_CENTER - 60,
      top: CANVAS_CENTER - 60,
      radius: 60,
      fill: "",
      stroke: "#D4AF37",
      strokeWidth: 6,
      startAngle: -40,
      endAngle: 220,
      objectId: uuidv4(),
    } as any);
    fabricRef.current.add(arc);
    fabricRef.current.setActiveObject(arc);
    fabricRef.current.requestRenderAll();
  };

  const applyMetalColor = (hex: string) => {
    const active = fabricRef.current?.getActiveObject();
    if (!active) return;
    active.set("fill", hex);
    if ("stroke" in active) active.set("stroke", hex);
    fabricRef.current?.requestRenderAll();
  };

  const deleteActive = () => {
    const active = fabricRef.current?.getActiveObject();
    if (!active || !fabricRef.current) return;
    fabricRef.current.remove(active);
    fabricRef.current.requestRenderAll();
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Gem shapes</h3>
        <div className="flex flex-wrap gap-2">
          {GEM_SHAPES.map((g) => (
            <button
              key={g.id}
              onClick={() => addGem(g.id)}
              className="rounded-sm border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent/60"
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Band</h3>
        <button onClick={addArc} className="w-fit rounded-sm border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent/60">
          Add band arc
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Metal color (selected shape)</h3>
        <div className="flex gap-2">
          {METAL_SWATCHES.map((swatch) => (
            <button
              key={swatch.hex}
              title={swatch.label}
              onClick={() => applyMetalColor(swatch.hex)}
              className="h-8 w-8 rounded-full border border-border"
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
      </div>

      <button onClick={deleteActive} className="w-fit text-xs text-muted-foreground hover:text-destructive">
        Delete selected shape
      </button>
    </div>
  );
};

export default SketchToolbar;
