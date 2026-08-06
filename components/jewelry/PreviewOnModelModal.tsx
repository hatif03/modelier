"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { startGeneration, pollGeneration } from "@/lib/ai-model-studio/api";
import { GenerationView, JewelryCategory } from "@/lib/ai-model-studio/types";
import useInterval from "@/hooks/useInterval";
import GenerationResultsGrid from "@/components/shared/generation-results/GenerationResultsGrid";

type ReferenceModel = { id: string; label: string };

type Props = {
  category: JewelryCategory;
  renderedImageUrl: string;
  onClose: () => void;
};

// The explicit bridge from a finished Jewelry Studio design to YouCam jewelry VTO —
// deliberately separate from the marketing canvas: this modal never touches any
// Project/canvas state, it only calls the same /api/generations endpoint the
// marketing-canvas AI Model Studio panel uses, passing the design's own rendered image
// as refImageUrl instead of uploading a fresh file.
const PreviewOnModelModal = ({ category, renderedImageUrl, onClose }: Props) => {
  const [referenceModels, setReferenceModels] = useState<ReferenceModel[]>([]);
  const [generation, setGeneration] = useState<GenerationView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reference-models")
      .then((res) => res.json())
      .then((json) => setReferenceModels(json.referenceModels ?? []))
      .catch(() => setReferenceModels([]));
  }, []);

  const run = async () => {
    setErrorMessage(null);
    try {
      const started = await startGeneration({
        file: null,
        flow: "jewelry_vto",
        jewelryCategory: category,
        refImageUrl: renderedImageUrl,
        referenceModelIds: referenceModels.map((m) => m.id),
      });
      setGeneration(started);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to start preview.");
    }
  };

  useInterval(() => {
    if (!generation || generation.status !== "processing") return;
    pollGeneration(generation)
      .then(setGeneration)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Failed to check preview status."));
  }, generation?.status === "processing" ? 2000 : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-foreground">Preview on a model</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>

        {!generation && (
          <Button onClick={run} disabled={referenceModels.length === 0}>
            {referenceModels.length === 0 ? "Loading reference models…" : "Generate previews"}
          </Button>
        )}

        {errorMessage && <p className="mt-3 text-xs text-destructive">{errorMessage}</p>}

        {generation && (
          <GenerationResultsGrid variants={generation.variants} className="mt-4 grid grid-cols-2 gap-3" />
        )}
      </div>
    </div>
  );
};

export default PreviewOnModelModal;
