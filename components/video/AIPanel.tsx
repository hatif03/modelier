"use client";

import { useState } from "react";
import { Subtitles, Scissors, Sparkles, Wand2, Video } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { useTimelineStore, useTimelineStoreApi } from "@/lib/video-engine/context";
import { isMediaClip, type MediaClip, type MediaAsset } from "@/lib/video-engine/types";
import { getVideoTemplate } from "@/lib/video/templates";
import { transcribeAsset, type TranscribeProgress } from "@/lib/video/transcription";
import { computeAutoEditPlan, applyAutoEdit } from "@/lib/video/autoEdit";
import { buildCaptionClips } from "@/lib/video/captions";
import { requestAutoAssemblePlan, applyAutoAssemblePlan } from "@/lib/video/autoAssemble";
import { probeMedia } from "@/lib/video-engine/probe";
import { saveMediaFile } from "@/lib/video-engine/storage";
import { Button } from "@/components/ui/button";
import Dropzone from "@/components/ui/dropzone";

import MaskPainter from "../panels/ai-model-studio/MaskPainter";
import VideoEffectTemplatePicker from "./VideoEffectTemplatePicker";

type VideoEffectId =
  | "video_enhancer"
  | "video_face_swap"
  | "video_background_replace"
  | "video_object_removal"
  | "video_style_transfer";

// Grabs a still frame (frame 0) from a video URL as a File — used to give
// MaskPainter something to paint on for AI Video Object Removal, which
// requires a mask image plus the frame index it corresponds to. v1 only
// supports painting over frame 0 — a documented scope limit, not a silent
// one: fine for the short single-shot clips this campaign uses, not a
// general frame-accurate mask editor.
async function captureFirstFrame(url: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.addEventListener("loadeddata", () => {
      video.currentTime = 0;
    });
    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Couldn't capture a frame from this clip."));
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Couldn't capture a frame from this clip."));
          return;
        }
        resolve(new File([blob], "frame-0.png", { type: "image/png" }));
      }, "image/png");
    });
    video.addEventListener("error", () => reject(new Error("Couldn't load this clip to capture a frame.")));
  });
}

const AIPanel = () => {
  const storeApi = useTimelineStoreApi();
  const templateId = useTimelineStore((s) => s.templateId);
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const clips = useTimelineStore((s) => s.clips);
  const media = useTimelineStore((s) => s.media);
  const transcripts = useTimelineStore((s) => s.transcripts);

  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [videoEffect, setVideoEffect] = useState<VideoEffectId | null>(null);
  const [videoEffectRefFile, setVideoEffectRefFile] = useState<File | null>(null);
  const [videoEffectMaskFile, setVideoEffectMaskFile] = useState<File | null>(null);
  const [videoEffectFrame, setVideoEffectFrame] = useState<File | null>(null);
  const [videoEffectTemplateId, setVideoEffectTemplateId] = useState<string | null>(null);
  const [backgroundMode, setBackgroundMode] = useState<"crop" | "stretch">("crop");

  const template = getVideoTemplate(templateId);
  const selectedClip = clips.find((c) => c.id === selectedClipId);
  const targetClip = selectedClip && isMediaClip(selectedClip) && selectedClip.type !== "image" ? selectedClip : undefined;
  const targetAsset = targetClip ? media[targetClip.mediaId] : undefined;
  const transcript = targetClip ? transcripts[targetClip.mediaId] : undefined;
  const videoClip = targetClip && targetClip.type === "video" ? targetClip : undefined;

  const runTranscribe = async () => {
    if (!targetClip || !targetAsset) return;
    setBusy("transcribe");
    try {
      const result = await transcribeAsset(targetAsset, (p: TranscribeProgress) =>
        setStatus(p.status === "loading-model" ? "Loading speech model…" : "Transcribing…")
      );
      storeApi.getState().setTranscript(targetAsset.id, result);
      setStatus(`Transcribed ${result.words.length} words.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Transcription failed.");
    } finally {
      setBusy(null);
    }
  };

  const runAutoEdit = () => {
    if (!targetClip || !transcript) return;
    setBusy("auto-edit");
    try {
      const keepRanges = computeAutoEditPlan(transcript, targetClip.sourceInMs, targetClip.sourceOutMs);
      const updated = applyAutoEdit(storeApi.getState().clips, targetClip as MediaClip, keepRanges);
      storeApi.getState().replaceClips(updated);
      setStatus(`Removed ${keepRanges.length ? "silence and filler words" : "nothing — clip was already tight"}.`);
    } finally {
      setBusy(null);
    }
  };

  const runCaptions = () => {
    if (!targetClip || !transcript || !template) return;
    setBusy("captions");
    try {
      const trackId = storeApi.getState().ensureTrack("caption");
      const cueClips = buildCaptionClips(transcript, trackId, template.captionStyle, targetClip);
      storeApi.getState().addClips(cueClips);
      setStatus(`Added ${cueClips.length} caption cues.`);
    } finally {
      setBusy(null);
    }
  };

  const runAutoAssemble = async () => {
    if (!template) return;
    const videoTrackIds = new Set(storeApi.getState().tracks.filter((t) => t.kind === "video").map((t) => t.id));
    const state = storeApi.getState();
    const candidateClips = state.clips.filter((c) => videoTrackIds.has(c.trackId) && isMediaClip(c)) as MediaClip[];
    if (candidateClips.length < 2) {
      setStatus("Import at least two clips before auto-assembling.");
      return;
    }

    setBusy("auto-assemble");
    setStatus("Asking the assistant to arrange your clips…");
    try {
      const plan = await requestAutoAssemblePlan({
        templateLabel: template.label,
        pacing: template.pacing,
        clips: candidateClips.map((c) => ({
          id: c.id,
          name: state.media[c.mediaId]?.name ?? c.type,
          durationMs: c.durationMs,
          transcriptText: state.transcripts[c.mediaId]?.words.map((w) => w.text).join(" "),
        })),
      });
      storeApi.getState().replaceClips(applyAutoAssemblePlan(storeApi.getState().clips, plan));
      setStatus(plan.notes ?? "Clips re-arranged.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Auto-assembly failed.");
    } finally {
      setBusy(null);
    }
  };

  // Shared submit-then-poll runner for all five real-video AI effects — POSTs
  // the clip's bytes (+ whatever extra input this effect needs) to
  // /api/video/ai-effect, polls the sibling status route the same way
  // AIModelStudioPanel polls /api/generations/[id]/status, then imports the
  // result as a NEW clip (not a silent replace of the original — these are
  // real paid AI calls, the source stays recoverable) via the exact
  // fetch→File→probeMedia→saveMediaFile→addMedia pipeline already proven by
  // VideoEditor.tsx's "Send to Video Studio" import flow.
  const runVideoEffect = async (
    effectId: VideoEffectId,
    params: Record<string, unknown>,
    extra?: { refFile?: File | null; maskFile?: File | null }
  ) => {
    if (!videoClip || !targetAsset) return;
    setBusy(effectId);
    setStatus("Uploading clip…");
    try {
      const sourceBlob = await (await fetch(targetAsset.url)).blob();
      const sourceFile = new File([sourceBlob], targetAsset.name || "clip.mp4", { type: sourceBlob.type || "video/mp4" });

      const form = new FormData();
      form.set("effectId", effectId);
      form.set("file", sourceFile);
      form.set("params", JSON.stringify(params));
      if (extra?.refFile) form.set("refFile", extra.refFile);
      if (extra?.maskFile) form.set("maskFile", extra.maskFile);

      const submitRes = await fetch("/api/video/ai-effect", { method: "POST", body: form });
      const submitJson = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitJson?.error ?? "Failed to start the effect.");

      const { taskId, feature } = submitJson as { taskId: string; feature: string };
      setStatus("Processing…");

      let resultUrl: string | undefined;
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(`/api/video/ai-effect/status?taskId=${encodeURIComponent(taskId)}&feature=${encodeURIComponent(feature)}`);
        const pollJson = await pollRes.json();
        const result = pollJson.result;
        if (result?.status === "success") {
          resultUrl = (result.results as { url?: string } | undefined)?.url;
          break;
        }
        if (result?.status === "error") {
          throw new Error(result.errorMessage ?? "The effect failed.");
        }
      }
      if (!resultUrl) throw new Error("Timed out waiting for the effect to finish.");

      setStatus("Importing result…");
      const resultBlob = await (await fetch(resultUrl)).blob();
      const resultFile = new File([resultBlob], "ai-effect-clip.mp4", { type: resultBlob.type || "video/mp4" });
      const id = uuidv4();
      const probed = await probeMedia(resultFile);
      await saveMediaFile(id, resultFile);
      const asset: MediaAsset = { id, url: URL.createObjectURL(resultFile), ...probed };
      storeApi.getState().addMedia(asset);
      storeApi.getState().appendMediaClip(id);
      setStatus("Added the result as a new clip.");
      setVideoEffect(null);
      setVideoEffectRefFile(null);
      setVideoEffectMaskFile(null);
      setVideoEffectFrame(null);
      setVideoEffectTemplateId(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "The effect failed.");
    } finally {
      setBusy(null);
    }
  };

  const toggleVideoEffect = async (effectId: VideoEffectId) => {
    if (videoEffect === effectId) {
      setVideoEffect(null);
      return;
    }
    setVideoEffect(effectId);
    setVideoEffectRefFile(null);
    setVideoEffectMaskFile(null);
    setVideoEffectTemplateId(null);
    if (effectId === "video_object_removal" && targetAsset) {
      try {
        setVideoEffectFrame(await captureFirstFrame(targetAsset.url));
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Couldn't capture a frame to paint on.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-2 rounded-md border border-border p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Selected clip</p>
        {targetClip && targetAsset ? (
          <>
            <p className="truncate text-xs text-foreground">{targetAsset.name}</p>
            <Button size="sm" variant="outline" disabled={busy !== null} onClick={runTranscribe}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {busy === "transcribe" ? "Transcribing…" : transcript ? "Re-transcribe" : "Transcribe"}
            </Button>
            <Button size="sm" variant="outline" disabled={busy !== null || !transcript} onClick={runAutoEdit}>
              <Scissors className="mr-1.5 h-3.5 w-3.5" />
              Remove silence & filler words
            </Button>
            <Button size="sm" variant="outline" disabled={busy !== null || !transcript} onClick={runCaptions}>
              <Subtitles className="mr-1.5 h-3.5 w-3.5" />
              Generate captions
            </Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Select a video or audio clip on the timeline.</p>
        )}
      </div>

      {videoClip && targetAsset && (
        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">AI video effects</p>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant={videoEffect === "video_enhancer" ? "default" : "outline"} disabled={busy !== null} onClick={() => toggleVideoEffect("video_enhancer")}>
              <Video className="mr-1.5 h-3.5 w-3.5" />
              Enhance
            </Button>
            <Button size="sm" variant={videoEffect === "video_face_swap" ? "default" : "outline"} disabled={busy !== null} onClick={() => toggleVideoEffect("video_face_swap")}>
              Face swap
            </Button>
            <Button size="sm" variant={videoEffect === "video_background_replace" ? "default" : "outline"} disabled={busy !== null} onClick={() => toggleVideoEffect("video_background_replace")}>
              Replace background
            </Button>
            <Button size="sm" variant={videoEffect === "video_object_removal" ? "default" : "outline"} disabled={busy !== null} onClick={() => toggleVideoEffect("video_object_removal")}>
              Remove object
            </Button>
            <Button size="sm" variant={videoEffect === "video_style_transfer" ? "default" : "outline"} disabled={busy !== null} onClick={() => toggleVideoEffect("video_style_transfer")}>
              Style transfer
            </Button>
          </div>

          {videoEffect === "video_enhancer" && (
            <Button
              size="sm"
              variant="gradient"
              disabled={busy !== null}
              onClick={() => runVideoEffect("video_enhancer", { dstDuration: Math.max(1, Math.round(videoClip.durationMs / 1000)) })}
            >
              {busy === "video_enhancer" ? "Enhancing…" : "Run enhance"}
            </Button>
          )}

          {videoEffect === "video_face_swap" && (
            <>
              <Dropzone file={videoEffectRefFile} onFileSelected={setVideoEffectRefFile} label="Upload the face to swap in" />
              <Button
                size="sm"
                variant="gradient"
                disabled={busy !== null || !videoEffectRefFile}
                onClick={() =>
                  runVideoEffect(
                    "video_face_swap",
                    { dstDuration: Math.max(1, Math.round(videoClip.durationMs / 1000)) },
                    { refFile: videoEffectRefFile }
                  )
                }
              >
                {busy === "video_face_swap" ? "Swapping…" : "Run face swap"}
              </Button>
            </>
          )}

          {videoEffect === "video_background_replace" && (
            <>
              <Dropzone file={videoEffectRefFile} onFileSelected={setVideoEffectRefFile} label="Upload the new background photo" />
              <div className="flex gap-1.5">
                <Button size="sm" variant={backgroundMode === "crop" ? "default" : "outline"} onClick={() => setBackgroundMode("crop")}>
                  Crop
                </Button>
                <Button size="sm" variant={backgroundMode === "stretch" ? "default" : "outline"} onClick={() => setBackgroundMode("stretch")}>
                  Stretch
                </Button>
              </div>
              <Button
                size="sm"
                variant="gradient"
                disabled={busy !== null || !videoEffectRefFile}
                onClick={() => runVideoEffect("video_background_replace", { backgroundMode }, { refFile: videoEffectRefFile })}
              >
                {busy === "video_background_replace" ? "Replacing…" : "Run background replace"}
              </Button>
            </>
          )}

          {videoEffect === "video_object_removal" && (
            <>
              <MaskPainter sourceFile={videoEffectFrame} label="Paint over the object (frame 0 only)" onMaskFile={setVideoEffectMaskFile} />
              <Button
                size="sm"
                variant="gradient"
                disabled={busy !== null || !videoEffectMaskFile}
                onClick={() => runVideoEffect("video_object_removal", { frameIdx: 0 }, { maskFile: videoEffectMaskFile })}
              >
                {busy === "video_object_removal" ? "Removing…" : "Run object removal"}
              </Button>
            </>
          )}

          {videoEffect === "video_style_transfer" && (
            <>
              <VideoEffectTemplatePicker feature="video-trans" value={videoEffectTemplateId} onSelect={setVideoEffectTemplateId} />
              <Button
                size="sm"
                variant="gradient"
                disabled={busy !== null || !videoEffectTemplateId}
                onClick={() => runVideoEffect("video_style_transfer", { templateId: videoEffectTemplateId })}
              >
                {busy === "video_style_transfer" ? "Applying…" : "Run style transfer"}
              </Button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-border p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Whole project</p>
        <Button size="sm" variant="gradient" disabled={busy !== null} onClick={runAutoAssemble}>
          <Wand2 className="mr-1.5 h-3.5 w-3.5" />
          {busy === "auto-assemble" ? "Arranging…" : `Auto-assemble for ${template?.label ?? "this template"}`}
        </Button>
      </div>

      {status && <p className="text-[10px] text-muted-foreground">{status}</p>}
    </div>
  );
};

export default AIPanel;
