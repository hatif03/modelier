"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { AppHeader } from "@/components/shell/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import { cadClient } from "@/lib/jewelry/cad/client";
import type { TessellatedAssembly } from "@/lib/jewelry/cad/protocol";
import { DEFAULT_RING_DESIGN } from "@/lib/jewelry/cad/schema/ring";
import { DEFAULT_NECKLACE_DESIGN } from "@/lib/jewelry/cad/schema/necklace";
import { DEFAULT_EARRING_DESIGNS } from "@/lib/jewelry/cad/schema/earring";
import { DEFAULT_BRACELET_DESIGNS } from "@/lib/jewelry/cad/schema/bracelet";
import { DEFAULT_WATCH_DESIGN } from "@/lib/jewelry/cad/schema/watch";

import CadViewport, { type CadViewportHandle } from "./CadViewport";
import CadPanel from "./CadPanel";
import CadExportButtons from "./CadExportButtons";
import CadAssistantPanel from "./CadAssistantPanel";

type CadDesign = {
  id: string;
  name: string;
  category: JewelryCategory;
  method: "cad";
  designJson: unknown;
  renderedImageUrl: string | null;
};

const REBUILD_DEBOUNCE_MS = 300;

function defaultDesign(category: JewelryCategory): unknown {
  switch (category) {
    case "ring":
      return DEFAULT_RING_DESIGN;
    case "necklace":
      return DEFAULT_NECKLACE_DESIGN;
    case "earring":
      return DEFAULT_EARRING_DESIGNS.stud;
    case "bracelet":
      return DEFAULT_BRACELET_DESIGNS.chain;
    case "watch":
      return DEFAULT_WATCH_DESIGN;
  }
}

function metalColorOf(design: unknown): string {
  const d = design as { metal?: { color?: string } };
  return d?.metal?.color ?? "yellow";
}

// Self-contained sibling to JewelryEditor.tsx (the fabric-based editor) — not
// retrofitted into its fabric-specific refs, since this needs a WebGL viewport and a
// worker-backed CAD kernel instead of a fabric.js canvas.
const CadEditor = ({ design }: { design: CadDesign }) => {
  const [name, setName] = useState(design.name);
  const [tree, setTree] = useState<unknown>(
    design.designJson && (design.designJson as { version?: number }).version === 1 ? design.designJson : defaultDesign(design.category)
  );
  const [assembly, setAssembly] = useState<TessellatedAssembly | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const viewportRef = useRef<CadViewportHandle>(null);
  const rebuildTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      cadClient.dispose();
    };
  }, []);

  useEffect(() => {
    if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
    rebuildTimer.current = setTimeout(async () => {
      setIsBuilding(true);
      try {
        const result = await cadClient.rebuild(design.category, tree);
        setAssembly(result);
      } catch (err) {
        setStatusMessage(err instanceof Error ? err.message : "Failed to build geometry.");
      } finally {
        setIsBuilding(false);
      }
    }, REBUILD_DEBOUNCE_MS);
    return () => {
      if (rebuildTimer.current) clearTimeout(rebuildTimer.current);
    };
  }, [design.category, tree]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await fetch(`/api/jewelry-designs/${design.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, designJson: tree }),
      });

      const dataUrl = viewportRef.current?.captureSnapshot();
      if (dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        const form = new FormData();
        form.set("file", blob, "design.png");
        await fetch(`/api/jewelry-designs/${design.id}/render`, { method: "PUT", body: form });
      }

      setStatusMessage("Saved.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        dense
        breadcrumb={[{ label: "Modelier", href: "/" }, { label: "Jewelry Studio", href: "/jewelry" }]}
        trailing={
          <Input value={name} onChange={(e) => setName(e.target.value)} className="input-ring h-8 w-48 border-border bg-background text-sm" />
        }
        actions={
          <>
            {statusMessage && <span className="text-xs text-muted-foreground">{statusMessage}</span>}
            {isBuilding && <span className="text-xs text-muted-foreground">Building…</span>}
            <CadExportButtons category={design.category} tree={tree} filenameBase={name || design.category} />
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      />

      <div className="flex flex-1">
        <div className="flex-1 bg-black/90">
          <CadViewport ref={viewportRef} assembly={assembly} metalColor={metalColorOf(tree)} />
        </div>
        <aside className="flex w-72 flex-col border-l border-border bg-card">
          <Tabs defaultValue="design" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="mx-3 mt-3">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            </TabsList>
            <TabsContent value="design" className="flex-1 overflow-y-auto">
              <CadPanel category={design.category} design={tree} onChange={setTree} />
            </TabsContent>
            <TabsContent value="ai" className="flex-1 overflow-y-auto">
              <CadAssistantPanel category={design.category} tree={tree} onApply={setTree} />
            </TabsContent>
          </Tabs>
          <p className="border-t border-border p-3 text-[10px] text-muted-foreground">
            3D engine:{" "}
            <Link href="/oss-credits" className="underline hover:text-accent">
              Replicad (MIT) / OpenCascade.js (LGPL-2.1)
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
};

export default CadEditor;
