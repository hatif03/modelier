"use client";

import { useState } from "react";
import { PersonStanding } from "lucide-react";

import RecentItemsGrid, { type RecentItem } from "@/components/shared/RecentItemsGrid";
import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import PreviewOnModelModal from "./PreviewOnModelModal";

type DesignSummary = RecentItem & {
  category: JewelryCategory;
  method: string;
  renderedImageUrl: string | null;
};

const JewelryDesignGrid = () => {
  const [previewDesign, setPreviewDesign] = useState<DesignSummary | null>(null);

  return (
    <>
      <RecentItemsGrid<DesignSummary>
        title="Your designs"
        emptyLabel="Nothing yet — start a design above."
        fetchUrl="/api/jewelry-designs"
        listKey="jewelryDesigns"
        itemHref={(design) => `/jewelry/${design.id}`}
        deleteUrl={(id) => `/api/jewelry-designs/${id}`}
        renamePatchUrl={(id) => `/api/jewelry-designs/${id}`}
        renameMethod="PUT"
        renderMeta={(design) => (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {design.category} · {design.method}
          </p>
        )}
        renderHoverAction={(design) =>
          design.renderedImageUrl ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewDesign(design);
              }}
              className="text-muted-foreground hover:text-accent"
              aria-label="Preview on a model"
              title="Preview on a model"
            >
              <PersonStanding className="h-3.5 w-3.5" />
            </button>
          ) : null
        }
      />

      {previewDesign?.renderedImageUrl && (
        <PreviewOnModelModal
          category={previewDesign.category}
          renderedImageUrl={previewDesign.renderedImageUrl}
          onClose={() => setPreviewDesign(null)}
        />
      )}
    </>
  );
};

export default JewelryDesignGrid;
