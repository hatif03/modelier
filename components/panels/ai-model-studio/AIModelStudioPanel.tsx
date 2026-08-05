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
import VideoOptions from "./VideoOptions";
import GenerateActions from "./GenerateActions";
import VariantResultsGrid from "./VariantResultsGrid";
import GenerationStatus from "./GenerationStatus";
import RecentResultsStrip from "./RecentResultsStrip";

type ReferenceModel = { id: string; label: string };
type RecentVariant = { id: string; resultImageUrl: string; label: string; createdAt: string };

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
  deleteShapeFromStorage: (id: string) => void;
  allShapes: Array<any>;
};

const AIModelStudioPanel = ({ fabricRef, shapeRef, syncShapeInStorage, deleteShapeFromStorage, allShapes }: Props) => {
  const [flow, setFlow] = useState<AIStudioFlow>("apparel_vto");
  const [category, setCategory] = useState<ApparelCategory | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [shadeHex, setShadeHex] = useState("#C2185B");
  const [generation, setGeneration] = useState<GenerationView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [referenceModels, setReferenceModels] = useState<ReferenceModel[]>([]);
  const [hasPlaceholder, setHasPlaceholder] = useState(false);
  const [recentVariants, setRecentVariants] = useState<RecentVariant[]>([]);

  // Video flow state — animates a single arbitrary image, no ReferenceModel
  // diversity concept applies, so it's kept separate from the apparel/beauty
  // state above rather than overloading it.
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [useCanvasSelection, setUseCanvasSelection] = useState(true);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoResolution, setVideoResolution] = useState<"480" | "720" | "1080">("720");
  const [videoDuration, setVideoDuration] = useState<5 | 10>(5);

  useEffect(() => {
    fetch("/api/reference-models")
      .then((res) => res.json())
      .then((json) => setReferenceModels(json.referenceModels ?? []))
      .catch(() => setReferenceModels([]));
  }, []);

  const refreshRecentVariants = () => {
    fetch("/api/generations")
      .then((res) => res.json())
      .then((json) => {
        const variants = (json.generations ?? [])
          .flatMap((g: any) =>
            (g.variants ?? [])
              .filter((v: any) => v.status === "success" && v.resultImageUrl && v.youcamFeature !== "image-to-video")
              .map((v: any) => ({
                id: v.id,
                resultImageUrl: v.resultImageUrl,
                label: v.referenceModel?.label ?? "Render",
                createdAt: v.createdAt,
              }))
          )
          .sort((a: RecentVariant, b: RecentVariant) => (a.createdAt < b.createdAt ? 1 : -1))
          .slice(0, 8);
        setRecentVariants(variants);
      })
      .catch(() => setRecentVariants([]));
  };

  useEffect(refreshRecentVariants, []);

  const activeCanvasObject = fabricRef.current?.getActiveObject();
  const hasCanvasImageSelection = activeCanvasObject?.type === "image";

  const isGenerating = generation?.status === "processing";
  const canGenerate =
    flow === "image_to_video"
      ? Boolean(videoPrompt.trim() && ((useCanvasSelection && hasCanvasImageSelection) || videoFile))
      : referenceModels.length > 0 && (flow === "apparel_vto" ? Boolean(file && category) : Boolean(shadeHex));

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

  const runVideoGeneration = async () => {
    if (!videoPrompt.trim()) {
      setErrorMessage("Describe the motion you want in the clip.");
      return;
    }

    let sourceFile = videoFile;
    if (useCanvasSelection && hasCanvasImageSelection) {
      const dataUrl = (activeCanvasObject as fabric.Image).toDataURL({ format: "png" });
      const blob = await (await fetch(dataUrl)).blob();
      sourceFile = new File([blob], "canvas-selection.png", { type: "image/png" });
    }
    if (!sourceFile) {
      setErrorMessage("Select an image on the canvas or upload one to animate.");
      return;
    }

    setErrorMessage(null);
    try {
      const started = await startGeneration({
        file: sourceFile,
        flow: "image_to_video",
        referenceModelIds: [],
        prompt: videoPrompt.trim(),
        resolution: videoResolution,
        durationSeconds: videoDuration,
      });
      setGeneration(started);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to start video generation.");
    }
  };

  useInterval(() => {
    if (!generation || generation.status !== "processing") return;
    pollGeneration(generation)
      .then(setGeneration)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Failed to check generation status."));
  }, generation?.status === "processing" ? 2000 : null);

  // Re-derived on every canvas-content change (allShapes), not just on our
  // own generation state — a reopened project hydrates its objects from
  // Liveblocks asynchronously after mount, so a template's placeholder may
  // not exist yet the first time this ran. The setTimeout is deliberate, not
  // decorative: Home's own renderCanvas effect (the one that actually calls
  // fabricCanvas.add(...) for each hydrated object) is a PARENT effect, and
  // React flushes child effects before parent effects in the same commit —
  // so checking fabricRef.current synchronously here can run before that
  // mutation happens, even though allShapes has already updated. Deferring
  // to a macrotask guarantees it runs after the whole commit's effects.
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasPlaceholder(Boolean(findEmptyPlaceholder(fabricRef.current)));
    }, 0);
    return () => clearTimeout(timer);
  }, [fabricRef, generation, allShapes?.length]);

  // Once a generation lands (success or partial), refresh the recents strip
  // so the new render shows up there too, not just in the results grid below.
  useEffect(() => {
    if (generation?.status !== "success" && generation?.status !== "partial") return;
    refreshRecentVariants();
  }, [generation?.status]);

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

  // A past render clicked from the recents strip should land wherever a
  // fresh one would — into an empty template placeholder if this project has
  // one, otherwise straight onto the canvas.
  const handleRecentResultClick = (url: string) => {
    if (hasPlaceholder) handleDropIntoPlaceholder(url);
    else handleAddToCanvas(url);
  };

  return (
    <div className="flex flex-col">
      <FlowSelector flow={flow} onChange={handleFlowChange} />

      <RecentResultsStrip variants={recentVariants} onAddToCanvas={handleRecentResultClick} />

      {flow === "apparel_vto" ? (
        <>
          <ApparelCategorySelector value={category} onChange={setCategory} />
          <div className="px-5 py-3">
            <h3 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Product photo</h3>
            <Dropzone file={file} onFileSelected={setFile} label="Upload a flat-lay or mannequin photo" />
          </div>
        </>
      ) : flow === "makeup_vto" ? (
        <BeautyShadeSelector value={shadeHex} onChange={setShadeHex} />
      ) : (
        <VideoOptions
          file={videoFile}
          onFileSelected={(f) => {
            setVideoFile(f);
            setUseCanvasSelection(false);
          }}
          hasCanvasSelection={hasCanvasImageSelection}
          useCanvasSelection={useCanvasSelection && hasCanvasImageSelection}
          onUseCanvasSelection={() => setUseCanvasSelection(true)}
          prompt={videoPrompt}
          onPromptChange={setVideoPrompt}
          resolution={videoResolution}
          onResolutionChange={setVideoResolution}
          durationSeconds={videoDuration}
          onDurationChange={setVideoDuration}
        />
      )}

      {errorMessage && <GenerationStatus message={errorMessage} />}

      <GenerateActions
        disabled={!canGenerate}
        isGenerating={isGenerating}
        onGenerate={
          flow === "image_to_video"
            ? runVideoGeneration
            : () => runGeneration([referenceModels[0]?.id].filter(Boolean))
        }
        onGenerateBatch={flow === "image_to_video" ? undefined : () => runGeneration(referenceModels.map((m) => m.id))}
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
