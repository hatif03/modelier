"use client";

import { useEffect, useMemo, useState } from "react";
import { fabric } from "fabric";

import PanelShell from "./panels/PanelShell";
import PanelRail, { PanelTabId } from "./panels/PanelRail";
import LayersPanel from "./panels/LayersPanel";
import AIModelStudioPanel from "./panels/ai-model-studio/AIModelStudioPanel";
import StyleAssistantPanel from "./panels/ai-model-studio/StyleAssistantPanel";
import TemplateGalleryPanel from "./panels/templates/TemplateGalleryPanel";
import BrandKitPanel from "./panels/brand-kit/BrandKitPanel";
import UploadsPanel from "./panels/uploads/UploadsPanel";

type Props = {
  allShapes: Array<any>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
  deleteShapeFromStorage: (id: string) => void;
  deleteAllShapes: () => void;
};

const LeftSidebar = ({
  allShapes,
  fabricRef,
  shapeRef,
  activeObjectRef,
  syncShapeInStorage,
  deleteShapeFromStorage,
  deleteAllShapes,
}: Props) => {
  // Defaults to the judged feature, not Layers — Projects (browse/open/delete)
  // moved out to the Dashboard entirely. `null` means the rail is collapsed —
  // clicking the active rail icon again, or Escape, returns here, and only
  // one panel is ever open at a time.
  const [activeTab, setActiveTab] = useState<PanelTabId | null>("ai-studio");

  const handleRailChange = (tab: PanelTabId) => {
    setActiveTab((current) => (current === tab ? null : tab));
  };

  // Scoped to only exist while a panel is open, so this doesn't become a
  // third always-on global key listener alongside lib/key-events.ts and
  // Live.tsx's own cursor/chat/reaction shortcuts.
  useEffect(() => {
    if (!activeTab) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveTab(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTab]);

  // Same memo boundary the original single-purpose LeftSidebar used — keyed
  // on length so it doesn't re-render on every canvas mouse move (allShapes
  // is a fresh array from App.tsx on every render); the panel tracks its own
  // selection/lock/visibility state internally instead of depending on props
  // for that.
  const memoizedLayersPanel = useMemo(
    () => <LayersPanel allShapes={allShapes} fabricRef={fabricRef} syncShapeInStorage={syncShapeInStorage} />,
    [allShapes?.length, fabricRef, syncShapeInStorage]
  );

  return (
    <>
      <PanelRail active={activeTab} onChange={handleRailChange} />
      {activeTab && (
        <PanelShell>
          {activeTab === "ai-studio" && (
            <AIModelStudioPanel
              fabricRef={fabricRef}
              shapeRef={shapeRef}
              syncShapeInStorage={syncShapeInStorage}
              deleteShapeFromStorage={deleteShapeFromStorage}
              allShapes={allShapes}
            />
          )}
          {activeTab === "assistant" && (
            <StyleAssistantPanel
              fabricRef={fabricRef}
              activeObjectRef={activeObjectRef}
              shapeRef={shapeRef}
              syncShapeInStorage={syncShapeInStorage}
            />
          )}
          {activeTab === "templates" && (
            <TemplateGalleryPanel fabricRef={fabricRef} deleteAllShapes={deleteAllShapes} syncShapeInStorage={syncShapeInStorage} />
          )}
          {activeTab === "brand-kit" && (
            <BrandKitPanel
              fabricRef={fabricRef}
              shapeRef={shapeRef}
              activeObjectRef={activeObjectRef}
              syncShapeInStorage={syncShapeInStorage}
            />
          )}
          {activeTab === "uploads" && <UploadsPanel fabricRef={fabricRef} syncShapeInStorage={syncShapeInStorage} />}
          {activeTab === "layers" && memoizedLayersPanel}
        </PanelShell>
      )}
    </>
  );
};

export default LeftSidebar;
