"use client";

import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";

import { initializeFabric } from "@/lib/canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/shell/AppHeader";
import ConfiguratorPanel from "./ConfiguratorPanel";
import SketchToolbar from "./SketchToolbar";
import PreviewOnModelModal from "./PreviewOnModelModal";
import type { JewelryCategory } from "@/lib/ai-model-studio/types";

type Design = {
  id: string;
  name: string;
  category: JewelryCategory;
  method: "configurator" | "sketch";
  designJson: any;
  renderedImageUrl: string | null;
};

const CANVAS_SIZE = 480;

const JewelryEditor = ({ design }: { design: Design }) => {
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const designJsonRef = useRef<any>(design.designJson);

  const [name, setName] = useState(design.name);
  const [method, setMethod] = useState(design.method);
  const [isSaving, setIsSaving] = useState(false);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(design.renderedImageUrl);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fabricRef.current = initializeFabric({ fabricRef, canvasRef: canvasElRef, width: CANVAS_SIZE, height: CANVAS_SIZE });

    if (design.method === "sketch" && Array.isArray(design.designJson) && design.designJson.length > 0) {
      fabric.util.enlivenObjects(
        design.designJson,
        (objects: fabric.Object[]) => {
          objects.forEach((obj) => fabricRef.current?.add(obj));
          fabricRef.current?.renderAll();
        },
        "fabric"
      );
    }

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!fabricRef.current) return;
    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (method === "sketch") {
        designJsonRef.current = fabricRef.current.toJSON(["objectId"]).objects;
      }

      const dataUrl = fabricRef.current.toDataURL({ format: "png" });
      const blob = await (await fetch(dataUrl)).blob();

      await fetch(`/api/jewelry-designs/${design.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, designJson: designJsonRef.current }),
      });

      const renderForm = new FormData();
      renderForm.set("file", blob, "design.png");
      const renderRes = await fetch(`/api/jewelry-designs/${design.id}/render`, { method: "PUT", body: renderForm });
      const renderJson = await renderRes.json();
      if (renderRes.ok) setRenderedImageUrl(renderJson.renderedImageUrl);

      setStatusMessage("Saved.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    if (!fabricRef.current) return;
    const dataUrl = fabricRef.current.toDataURL({ format: "png" });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${name || "jewelry-design"}.png`;
    a.click();
  };

  const handlePreview = async () => {
    if (!renderedImageUrl) {
      await handleSave();
    }
    setShowPreview(true);
  };

  // Escape hatch for a Configurator design whose category has no seeded
  // parts yet — Sketch works with zero external data, so switching is
  // always possible; the reverse isn't, since Sketch has no part-selection
  // state to translate back into a configurator layout.
  const handleSwitchToSketch = async () => {
    await fetch(`/api/jewelry-designs/${design.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "sketch" }),
    }).catch(() => {});
    setMethod("sketch");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        dense
        breadcrumb={[{ label: "Modelier", href: "/" }, { label: "Jewelry Studio", href: "/jewelry" }]}
        trailing={
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-ring h-8 w-48 border-border bg-background text-sm"
          />
        }
        actions={
          <>
            {statusMessage && <span className="text-xs text-muted-foreground">{statusMessage}</span>}
            <Button size="sm" variant="outline" onClick={handleExport}>
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={handlePreview} disabled={isSaving}>
              Preview on a model
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      />

      <div className="flex flex-1">
        <div className="flex flex-1 items-center justify-center p-8">
          {/* No className on the raw <canvas> itself — fabric.js clones the original
              canvas element's class list onto the "upper-canvas" overlay it creates for
              interactivity, so a class like bg-white here would paint an opaque
              background on top of the actual rendered content, hiding it visually while
              the lower canvas still paints correctly underneath (confirmed via direct
              pixel inspection during testing). Style the wrapper div instead. */}
          <div className="rounded-sm border border-border bg-white shadow-sm">
            <canvas ref={canvasElRef} />
          </div>
        </div>

        <aside className="w-72 border-l border-border bg-card">
          {method === "configurator" ? (
            <ConfiguratorPanel
              category={design.category}
              fabricRef={fabricRef}
              initialPartSelections={design.designJson?.partSelections ?? {}}
              onSelectionsChange={(selections) => {
                designJsonRef.current = { partSelections: selections };
              }}
              onSwitchToSketch={handleSwitchToSketch}
            />
          ) : (
            <SketchToolbar fabricRef={fabricRef} />
          )}
        </aside>
      </div>

      {showPreview && renderedImageUrl && (
        <PreviewOnModelModal category={design.category} renderedImageUrl={renderedImageUrl} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
};

export default JewelryEditor;
