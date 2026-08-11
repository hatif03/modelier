"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fabric } from "fabric";

import Dropzone from "@/components/ui/dropzone";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { insertImageFromUrl } from "@/lib/shapes";
import { findEmptyPlaceholder, dropVariantIntoPlaceholder } from "@/lib/templates";
import { startGeneration, pollGeneration } from "@/lib/ai-model-studio/api";
import {
  ApparelCategory,
  JewelryCategory,
  RingFinger,
  AIStudioFlow,
  GenerationView,
  APPAREL_CATEGORIES,
  JEWELRY_CATEGORIES,
  RING_FINGERS,
} from "@/lib/ai-model-studio/types";
import useInterval from "@/hooks/useInterval";
import CategorySelector from "@/components/shared/CategorySelector";
import { getEffect, defaultParamsFor, paramsForSubmission, isEffectReady } from "@/lib/ai-model-studio/effects";
import { buildBackdropPrompt } from "@/lib/ai-model-studio/backdrops";

import FlowSelector from "./FlowSelector";
import BeautyShadeSelector from "./BeautyShadeSelector";
import VideoOptions from "./VideoOptions";
import BackdropOptions from "./BackdropOptions";
import EffectParamsForm from "./EffectParamsForm";
import CastingCallPicker from "./CastingCallPicker";
import GenerateActions from "./GenerateActions";
import GenerationResultsGrid from "@/components/shared/generation-results/GenerationResultsGrid";
import GenerationStatus from "./GenerationStatus";
import RecentResultsStrip from "./RecentResultsStrip";

type ReferenceModel = { id: string; label: string; bodyType: string; undertone: string };

const MAX_CASTING_CALL = 4;
type RecentVariant = { id: string; resultImageUrl: string; label: string; createdAt: string };

type Props = {
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  shapeRef: React.MutableRefObject<fabric.Object | null>;
  syncShapeInStorage: (shape: fabric.Object) => void;
  deleteShapeFromStorage: (id: string) => void;
  allShapes: Array<any>;
};

const VALID_FLOWS: AIStudioFlow[] = ["apparel_vto", "makeup_vto", "jewelry_vto", "image_to_video", "effect", "backdrop"];

const AIModelStudioPanel = ({ fabricRef, shapeRef, syncShapeInStorage, deleteShapeFromStorage, allShapes }: Props) => {
  // Lets a dashboard entry point like "Edit a video" (CreateDesignModal.tsx)
  // land the user directly in a specific flow via `?flow=` instead of always
  // opening on Apparel — read once on mount, same lifetime as any other
  // default here.
  const searchParams = useSearchParams();
  const [flow, setFlow] = useState<AIStudioFlow>(() => {
    const requested = searchParams.get("flow");
    return VALID_FLOWS.includes(requested as AIStudioFlow) ? (requested as AIStudioFlow) : "apparel_vto";
  });
  const [category, setCategory] = useState<ApparelCategory | null>(null);
  const [jewelryCategory, setJewelryCategory] = useState<JewelryCategory | null>(null);
  const [ringFinger, setRingFinger] = useState<RingFinger>("ring");
  const [file, setFile] = useState<File | null>(null);
  const [effectId, setEffectId] = useState<string | null>(null);
  const [effectFile, setEffectFile] = useState<File | null>(null);
  const [effectRefFile, setEffectRefFile] = useState<File | null>(null);
  const [effectParams, setEffectParams] = useState<Record<string, number | string>>({});
  const [shadeHex, setShadeHex] = useState("#C2185B");
  const [generation, setGeneration] = useState<GenerationView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [referenceModels, setReferenceModels] = useState<ReferenceModel[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
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

  // Backdrop flow state — generates a scene from a prompt, no source photo
  // or ReferenceModel diversity concept applies (same shape as video above).
  const [backdropPreset, setBackdropPreset] = useState<string | null>(null);
  const [backdropExtra, setBackdropExtra] = useState("");

  useEffect(() => {
    fetch("/api/reference-models")
      .then((res) => res.json())
      .then((json) => {
        const models: ReferenceModel[] = json.referenceModels ?? [];
        setReferenceModels(models);
        // The whole cast is in the shoot by default — casting call is an
        // opt-out narrowing, not an opt-in from an empty selection.
        setSelectedModelIds(models.slice(0, MAX_CASTING_CALL).map((m) => m.id));
      })
      .catch(() => setReferenceModels([]));
  }, []);

  const toggleCastingModel = (id: string) => {
    setSelectedModelIds((prev) => {
      if (prev.includes(id)) return prev.filter((existing) => existing !== id);
      if (prev.length >= MAX_CASTING_CALL) return prev;
      return [...prev, id];
    });
  };

  // Scoped to the currently selected flow — recents from a different flow
  // (e.g. a jewelry render while browsing the apparel tab) used to show up
  // here regardless of which tab was active, which read as this panel
  // ignoring the flow you'd just picked.
  const refreshRecentVariants = () => {
    fetch("/api/generations")
      .then((res) => res.json())
      .then((json) => {
        const variants = (json.generations ?? [])
          .filter((g: any) => g.flow === flow)
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

  useEffect(refreshRecentVariants, [flow]);

  const activeCanvasObject = fabricRef.current?.getActiveObject();
  const hasCanvasImageSelection = activeCanvasObject?.type === "image";

  const activeEffect = effectId ? getEffect(effectId) : undefined;

  const isGenerating = generation?.status === "processing";
  const canGenerate =
    flow === "image_to_video"
      ? Boolean(videoPrompt.trim() && ((useCanvasSelection && hasCanvasImageSelection) || videoFile))
      : flow === "backdrop"
        ? Boolean(backdropPreset)
        : flow === "effect"
        ? Boolean(effectFile && effectId && activeEffect && isEffectReady(activeEffect, effectParams, Boolean(effectRefFile)))
        : flow === "apparel_vto"
          ? selectedModelIds.length > 0 && Boolean(file && category)
          : flow === "jewelry_vto"
            ? selectedModelIds.length > 0 && Boolean(file && jewelryCategory)
            : selectedModelIds.length > 0 && Boolean(shadeHex);

  const handleFlowChange = (next: AIStudioFlow) => {
    setFlow(next);
    setGeneration(null);
    setErrorMessage(null);
  };

  const handleEffectChange = (nextEffectId: string) => {
    setEffectId(nextEffectId);
    const next = getEffect(nextEffectId);
    setEffectParams(next ? defaultParamsFor(next) : {});
    setEffectRefFile(null);
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
    if (flow === "jewelry_vto") {
      if (!file) {
        setErrorMessage("Upload a clear jewelry product photo before generating.");
        return;
      }
      if (!jewelryCategory) {
        setErrorMessage("Pick a category so the AI knows what kind of piece this is.");
        return;
      }
    }

    setErrorMessage(null);
    try {
      const started = await startGeneration({
        file,
        flow,
        garmentCategory: flow === "apparel_vto" ? (category as ApparelCategory) : undefined,
        jewelryCategory: flow === "jewelry_vto" ? (jewelryCategory as JewelryCategory) : undefined,
        ringFinger: flow === "jewelry_vto" && jewelryCategory === "ring" ? ringFinger : undefined,
        shadeHex: flow === "makeup_vto" ? shadeHex : undefined,
        referenceModelIds,
      });
      setGeneration(started);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to start generation.");
    }
  };

  const runEffectGeneration = async () => {
    if (!effectFile || !effectId || !activeEffect) {
      setErrorMessage("Upload a photo before generating.");
      return;
    }

    setErrorMessage(null);
    try {
      const started = await startGeneration({
        file: effectFile,
        flow: "effect",
        effectId,
        effectParams: paramsForSubmission(activeEffect, effectParams),
        refFile: activeEffect.refPhotoLabel ? effectRefFile : undefined,
        referenceModelIds: [],
      });
      setGeneration(started);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to start generation.");
    }
  };

  const runBackdropGeneration = async () => {
    if (!backdropPreset) {
      setErrorMessage("Pick a scene to generate a backdrop.");
      return;
    }

    setErrorMessage(null);
    try {
      const started = await startGeneration({
        file: null,
        flow: "backdrop",
        referenceModelIds: [],
        prompt: buildBackdropPrompt(backdropPreset, backdropExtra),
      });
      setGeneration(started);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to start backdrop generation.");
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
    insertImageFromUrl({ url, canvas: fabricRef as any, shapeRef, syncShapeInStorage }).catch(() =>
      setErrorMessage("That image could no longer be loaded — it may be an old, expired result.")
    );
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
    }).catch(() => setErrorMessage("That image could no longer be loaded — it may be an old, expired result."));
    setHasPlaceholder(false);
  };

  // image_to_video generates a clip but this canvas has no timeline to put it
  // on — hand it off to Video Studio instead, opened in a new tab so the
  // canvas session here isn't lost. The editor fetches importUrl itself on
  // load and imports it like any other local media (see VideoEditor.tsx).
  const handleSendToVideoStudio = async (url: string) => {
    try {
      const res = await fetch("/api/video-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "general" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create a video project.");
      window.open(`/video/${json.videoProject.id}?importUrl=${encodeURIComponent(url)}`, "_blank");
    } catch {
      setErrorMessage("Couldn't send that clip to Video Studio — try again.");
    }
  };

  // A past render clicked from the recents strip should land wherever a
  // fresh one would — into an empty template placeholder if this project has
  // one, otherwise straight onto the canvas.
  const handleRecentResultClick = (url: string) => {
    if (hasPlaceholder) handleDropIntoPlaceholder(url);
    else handleAddToCanvas(url);
  };

  // Don't have a product photo yet for the jewelry flow? Cross-links to
  // Jewelry Studio so a user without an existing piece isn't stuck — only
  // shown before a file is picked, so it doesn't clutter the flow once one is.
  const showJewelryStudioHint = flow === "jewelry_vto" && !file;

  return (
    <div className="flex flex-col">
      <FlowSelector flow={flow} effectId={effectId} onChangeFlow={handleFlowChange} onChangeEffect={handleEffectChange} />

      {recentVariants.length > 0 && (
        <Accordion type="single" collapsible className="border-b border-border">
          <AccordionItem value="recent" className="border-none">
            <AccordionTrigger>Recent renders</AccordionTrigger>
            <AccordionContent>
              <RecentResultsStrip variants={recentVariants} onAddToCanvas={handleRecentResultClick} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {flow === "apparel_vto" ? (
        <>
          <CategorySelector categories={APPAREL_CATEGORIES} value={category} onChange={setCategory} />
          <div className="px-5 py-3">
            <h3 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Product photo</h3>
            <Dropzone file={file} onFileSelected={setFile} label="Upload a flat-lay or mannequin photo" />
          </div>
        </>
      ) : flow === "jewelry_vto" ? (
        <>
          <CategorySelector categories={JEWELRY_CATEGORIES} value={jewelryCategory} onChange={setJewelryCategory} />
          {jewelryCategory === "ring" && (
            <div className="border-b border-border px-5 py-3">
              <h3 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Finger</h3>
              <div className="grid grid-cols-5 gap-1.5">
                {RING_FINGERS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    aria-pressed={ringFinger === id}
                    onClick={() => setRingFinger(id)}
                    className={`rounded-sm border px-1 py-1.5 text-[10px] ${
                      ringFinger === id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground"
                    }`}
                  >
                    {label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="px-5 py-3">
            <h3 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Product photo</h3>
            <Dropzone file={file} onFileSelected={setFile} label="Upload a clear photo on a plain background" />
            {showJewelryStudioHint && (
              <a href="/jewelry" className="mt-2 block text-xs text-muted-foreground hover:text-accent">
                Don&apos;t have a product photo? Design one in Jewelry Studio →
              </a>
            )}
          </div>
        </>
      ) : flow === "makeup_vto" ? (
        <BeautyShadeSelector value={shadeHex} onChange={setShadeHex} />
      ) : flow === "effect" && activeEffect ? (
        <>
          <div className="px-5 py-3">
            <h3 className="font-serif text-sm text-foreground">{activeEffect.label}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{activeEffect.description}</p>
          </div>
          <EffectParamsForm
            effect={activeEffect}
            values={effectParams}
            onChange={(key, value) => setEffectParams((prev) => ({ ...prev, [key]: value }))}
          />
          <div className="px-5 py-3">
            <h3 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Photo</h3>
            <Dropzone file={effectFile} onFileSelected={setEffectFile} label="Upload a clear, well-lit photo" />
          </div>
          {activeEffect.refPhotoLabel && (
            <div className="px-5 py-3">
              <h3 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{activeEffect.refPhotoLabel}</h3>
              <Dropzone file={effectRefFile} onFileSelected={setEffectRefFile} label="Upload a second reference photo" />
            </div>
          )}
        </>
      ) : flow === "backdrop" ? (
        <BackdropOptions
          preset={backdropPreset}
          onPresetChange={setBackdropPreset}
          extra={backdropExtra}
          onExtraChange={setBackdropExtra}
        />
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

      {(flow === "apparel_vto" || flow === "jewelry_vto" || flow === "makeup_vto") && (
        <CastingCallPicker
          models={referenceModels}
          selectedIds={selectedModelIds}
          onToggle={toggleCastingModel}
          maxSelectable={MAX_CASTING_CALL}
        />
      )}

      {errorMessage && <GenerationStatus message={errorMessage} />}

      <GenerateActions
        disabled={!canGenerate}
        isGenerating={isGenerating}
        onGenerate={
          flow === "image_to_video"
            ? runVideoGeneration
            : flow === "backdrop"
              ? runBackdropGeneration
              : flow === "effect"
                ? runEffectGeneration
                : () => runGeneration([selectedModelIds[0]].filter(Boolean))
        }
        onGenerateBatch={
          flow === "image_to_video" || flow === "backdrop" || flow === "effect" || selectedModelIds.length < 2
            ? undefined
            : () => runGeneration(selectedModelIds)
        }
        batchLabel="Generate casting call"
      />

      {generation && (
        <>
          <Separator />
          <GenerationResultsGrid
            variants={generation.variants}
            onAddToCanvas={handleAddToCanvas}
            onDropIntoPlaceholder={hasPlaceholder ? handleDropIntoPlaceholder : undefined}
            onSendToVideoStudio={handleSendToVideoStudio}
            garmentColorHex={generation.garmentColorHex}
          />
        </>
      )}
    </div>
  );
};

export default AIModelStudioPanel;
