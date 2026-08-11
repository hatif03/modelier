"use client";

import { useState } from "react";
import { Subtitles, Scissors, Sparkles, Wand2 } from "lucide-react";

import { useTimelineStore, useTimelineStoreApi } from "@/lib/video-engine/context";
import { isMediaClip, type MediaClip } from "@/lib/video-engine/types";
import { getVideoTemplate } from "@/lib/video/templates";
import { transcribeAsset, type TranscribeProgress } from "@/lib/video/transcription";
import { computeAutoEditPlan, applyAutoEdit } from "@/lib/video/autoEdit";
import { buildCaptionClips } from "@/lib/video/captions";
import { requestAutoAssemblePlan, applyAutoAssemblePlan } from "@/lib/video/autoAssemble";
import { Button } from "@/components/ui/button";

const AIPanel = () => {
  const storeApi = useTimelineStoreApi();
  const templateId = useTimelineStore((s) => s.templateId);
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const clips = useTimelineStore((s) => s.clips);
  const media = useTimelineStore((s) => s.media);
  const transcripts = useTimelineStore((s) => s.transcripts);

  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const template = getVideoTemplate(templateId);
  const selectedClip = clips.find((c) => c.id === selectedClipId);
  const targetClip = selectedClip && isMediaClip(selectedClip) && selectedClip.type !== "image" ? selectedClip : undefined;
  const targetAsset = targetClip ? media[targetClip.mediaId] : undefined;
  const transcript = targetClip ? transcripts[targetClip.mediaId] : undefined;

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
