"use client";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

type Props = {
  /** The photo the mask is painted over — same file the effect will run on. */
  sourceFile: File | null;
  label: string;
  onMaskFile: (file: File | null) => void;
};

// A small, scoped fabric.Canvas (not the main design canvas) for painting a
// grayscale mask over a photo — required by the object-removal/replace photo
// editors, where a grayscale mask image (white = affected area, black =
// left alone) has to accompany the source photo. Reuses the exact
// isDrawingMode/freeDrawingBrush pattern already proven for the main
// canvas's freeform shape tool (lib/canvas.ts), just against a private
// canvas instance sized to the uploaded photo instead of the shared design
// canvas, and painting white-on-black instead of a stroke color.
const MASK_CANVAS_SIZE = 480;

const MaskPainter = ({ sourceFile, label, onMaskFile }: Props) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [brushWidth, setBrushWidth] = useState(30);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    if (!canvasElRef.current || !sourceFile) return;

    const canvas = new fabric.Canvas(canvasElRef.current, {
      isDrawingMode: true,
      backgroundColor: "#000000",
    });
    fabricCanvasRef.current = canvas;
    canvas.freeDrawingBrush.color = "#ffffff";
    canvas.freeDrawingBrush.width = brushWidth;

    const objectUrl = URL.createObjectURL(sourceFile);
    fabric.Image.fromURL(objectUrl, (img) => {
      const scale = Math.min(MASK_CANVAS_SIZE / (img.width ?? MASK_CANVAS_SIZE), MASK_CANVAS_SIZE / (img.height ?? MASK_CANVAS_SIZE));
      canvas.setWidth((img.width ?? MASK_CANVAS_SIZE) * scale);
      canvas.setHeight((img.height ?? MASK_CANVAS_SIZE) * scale);
      // The photo itself is only a paint-over guide — opacity keeps it
      // visible without letting it bleed into the exported grayscale mask.
      img.set({ scaleX: scale, scaleY: scale, selectable: false, evented: false, opacity: 0.35 });
      canvas.setOverlayImage(img, canvas.renderAll.bind(canvas));
    });

    canvas.on("path:created", () => setHasStrokes(true));

    return () => {
      URL.revokeObjectURL(objectUrl);
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFile]);

  useEffect(() => {
    if (fabricCanvasRef.current) fabricCanvasRef.current.freeDrawingBrush.width = brushWidth;
  }, [brushWidth]);

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.getObjects("path").forEach((obj) => canvas.remove(obj));
    canvas.renderAll();
    setHasStrokes(false);
    onMaskFile(null);
  };

  const handleUseMask = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    // Export the overlay image (guide photo) hidden so only the white
    // strokes on the black background make it into the mask file.
    const overlay = canvas.overlayImage;
    canvas.setOverlayImage(null as unknown as fabric.Image, () => {});
    const dataUrl = canvas.toDataURL({ format: "png" });
    canvas.setOverlayImage(overlay as fabric.Image, canvas.renderAll.bind(canvas));

    const blob = await (await fetch(dataUrl)).blob();
    onMaskFile(new File([blob], "mask.png", { type: "image/png" }));
  };

  if (!sourceFile) {
    return <p className="px-5 py-3 text-xs text-muted-foreground">Upload a photo first, then paint the mask here.</p>;
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-3">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</h3>
      <canvas ref={canvasElRef} className="rounded-md border border-border" />
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Brush</span>
        <Slider min={5} max={80} step={5} value={[brushWidth]} onValueChange={([v]) => setBrushWidth(v)} className="max-w-[140px]" />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button type="button" size="sm" onClick={handleUseMask} disabled={!hasStrokes}>
          Use this mask
        </Button>
      </div>
    </div>
  );
};

export default MaskPainter;
