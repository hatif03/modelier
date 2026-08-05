"use client";

import { useEffect, useState } from "react";
import { fabric } from "fabric";

import Dropzone from "@/components/ui/dropzone";
import { insertImageFromUrl } from "@/lib/shapes";
import { findEmptyPlaceholder, dropVariantIntoPlaceholder } from "@/lib/templates";
import { startGeneration, pollGeneration } from "@/lib/ai-model-studio/api";
import { ApparelCategory, AIStudioFlow, GenerationView } from "@/lib/ai-model-studio/types";
import useInterval from "@/hooks/useInterval";

import FlowSelector from "./FlowSelector";
import ApparelCategorySelector from "./ApparelCategorySelector";
import BeautyShadeSelector from "./BeautyShadeSelector";
import GenerateActions from "./GenerateActions";
import VariantResultsGrid from "./VariantResultsGrid";
import GenerationStatus from "./GenerationStatus";

type ReferenceModel = { id: string; label: string };

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
  deleteShapeFromStorage: (id: string) => void;
};

const AIModelStudioPanel = ({ fabricRef, shapeRef, syncShapeInStorage, deleteShapeFromStorage }: Props) => {
  const [flow, setFlow] = useState<AIStudioFlow>("apparel_vto");
  const [category, setCategory] = useState<ApparelCategory | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [shadeHex, setShadeHex] = useState("#C2185B");
  const [generation, setGeneration] = useState<GenerationView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [referenceModels, setReferenceModels] = useState<ReferenceModel[]>([]);
  const [hasPlaceholder, setHasPlaceholder] = useState(false);

  useEffect(() => {
    fetch("/api/reference-models")
      .then((res) => res.json())
      .then((json) => setReferenceModels(json.referenceModels ?? []))
      .catch(() => setReferenceModels([]));
  }, []);

  const isGenerating = generation?.status === "processing";
  const canGenerate =
    referenceModels.length > 0 && (flow === "apparel_vto" ? Boolean(file && category) : Boolean(shadeHex));

  const handleFlowChange = (next: AIStudioFlow) => {
    setFlow(next);
    setGeneration(null);
    setErrorMessage(null);
  };

  const runGeneration = async (referenceModelIds: string[]) => {
    if (flow === "apparel_vto") {
      if (!file) {
        setErrorMessage("Upload a clear, front-facing product photo before generating.");
        return;
      }
      if (!category) {
        setErrorMessage("Pick a category so the AI knows which part of the outfit to render.");
        return;
      }
    }

    setErrorMessage(null);
    try {
      const started = await startGeneration({
        file,
        flow,
        garmentCategory: flow === "apparel_vto" ? (category as ApparelCategory) : undefined,
        shadeHex: flow === "makeup_vto" ? shadeHex : undefined,
        referenceModelIds,
      });
      setGeneration(started);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to start generation.");
    }
  };

  useInterval(() => {
    if (!generation || generation.status !== "processing") return;
    pollGeneration(generation)
      .then(setGeneration)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Failed to check generation status."));
  }, generation?.status === "processing" ? 2000 : null);

  useEffect(() => {
    setHasPlaceholder(Boolean(findEmptyPlaceholder(fabricRef.current)));
  }, [fabricRef, generation]);

  const handleAddToCanvas = (url: string) => {
    if (!fabricRef.current) return;
    insertImageFromUrl({ url, canvas: fabricRef as any, shapeRef, syncShapeInStorage });
  };

  const handleDropIntoPlaceholder = (url: string) => {
    const placeholder = findEmptyPlaceholder(fabricRef.current);
    if (!placeholder) return;
    dropVariantIntoPlaceholder({
      url,
      placeholder,
      canvas: fabricRef as any,
      shapeRef,
      syncShapeInStorage,
      deleteShapeFromStorage,
    });
    setHasPlaceholder(false);
  };

  return (
    <div className="flex flex-col">
      <FlowSelector flow={flow} onChange={handleFlowChange} />

      {flow === "apparel_vto" ? (
        <>
          <ApparelCategorySelector value={category} onChange={setCategory} />
          <div className="px-5 py-3">
            <h3 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Product photo</h3>
            <Dropzone file={file} onFileSelected={setFile} label="Upload a flat-lay or mannequin photo" />
          </div>
        </>
      ) : (
        <BeautyShadeSelector value={shadeHex} onChange={setShadeHex} />
      )}

      {errorMessage && <GenerationStatus message={errorMessage} />}

      <GenerateActions
        disabled={!canGenerate}
        isGenerating={isGenerating}
        onGenerate={() => runGeneration([referenceModels[0]?.id].filter(Boolean))}
        onGenerateBatch={() => runGeneration(referenceModels.map((m) => m.id))}
      />

      {generation && (
        <VariantResultsGrid
          variants={generation.variants}
          onAddToCanvas={handleAddToCanvas}
          onDropIntoPlaceholder={hasPlaceholder ? handleDropIntoPlaceholder : undefined}
        />
      )}
    </div>
  );
};

export default AIModelStudioPanel;
