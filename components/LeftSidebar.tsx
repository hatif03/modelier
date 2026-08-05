"use client";

import { useMemo, useState } from "react";
import { fabric } from "fabric";

import PanelShell from "./panels/PanelShell";
import PanelTabs, { PanelTabId } from "./panels/PanelTabs";
import LayersPanel from "./panels/LayersPanel";
import AIModelStudioPanel from "./panels/ai-model-studio/AIModelStudioPanel";
import TemplateGalleryPanel from "./panels/templates/TemplateGalleryPanel";
import BrandKitPanel from "./panels/brand-kit/BrandKitPanel";
import ProjectsPanel from "./panels/projects/ProjectsPanel";

type Props = {
  allShapes: Array<any>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
  deleteShapeFromStorage: (id: string) => void;
  deleteAllShapes: () => void;
};

const LeftSidebar = ({
  allShapes,
  fabricRef,
  shapeRef,
  syncShapeInStorage,
  deleteShapeFromStorage,
  deleteAllShapes,
}: Props) => {
  const [activeTab, setActiveTab] = useState<PanelTabId>("layers");

  // Same memo boundary the original single-purpose LeftSidebar used — now scoped
  // to just the Layers tab's content so it still only re-renders on shape changes,
  // not on every canvas mouse move, without also freezing the other tabs' state.
  const memoizedLayersPanel = useMemo(
    () => <LayersPanel allShapes={allShapes} />,
    [allShapes?.length]
  );

  return (
    <PanelShell>
      <PanelTabs active={activeTab} onChange={setActiveTab} />
      {activeTab === "layers" && memoizedLayersPanel}
      {activeTab === "ai-studio" && (
        <AIModelStudioPanel
          fabricRef={fabricRef}
          shapeRef={shapeRef}
          syncShapeInStorage={syncShapeInStorage}
          deleteShapeFromStorage={deleteShapeFromStorage}
        />
      )}
      {activeTab === "templates" && (
        <TemplateGalleryPanel fabricRef={fabricRef} deleteAllShapes={deleteAllShapes} syncShapeInStorage={syncShapeInStorage} />
      )}
      {activeTab === "brand-kit" && (
        <BrandKitPanel fabricRef={fabricRef} shapeRef={shapeRef} syncShapeInStorage={syncShapeInStorage} />
      )}
      {activeTab === "projects" && (
        <ProjectsPanel
          allShapes={allShapes}
          fabricRef={fabricRef}
          deleteAllShapes={deleteAllShapes}
          syncShapeInStorage={syncShapeInStorage}
        />
      )}
    </PanelShell>
  );
};

export default LeftSidebar;
