"use client";

import { useRef } from "react";
import { Scissors, Trash2, Play, Pause } from "lucide-react";

import { useTimelineStore, useTimelineStoreApi } from "@/lib/video-engine/context";
import { isMediaClip, timelineDurationMs, type Clip } from "@/lib/video-engine/types";

const PX_PER_SEC = 60;
const MIN_DURATION_SEC = 15;
const TRACK_ROW_HEIGHT = 64;

function msToPx(ms: number) {
  return (ms / 1000) * PX_PER_SEC;
}
function pxToMs(px: number) {
  return (px / PX_PER_SEC) * 1000;
}

type DragMode = "move" | "trim-left" | "trim-right";
type DragState = { pointerId: number; startX: number; startMs: number; sourceInMs?: number; sourceOutMs?: number; mode: DragMode };

function ClipBlock({ clip }: { clip: Clip }) {
  const storeApi = useTimelineStoreApi();
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const media = useTimelineStore((s) => s.media);
  const dragRef = useRef<DragState | null>(null);

  const selected = selectedClipId === clip.id;
  const label = isMediaClip(clip) ? media[clip.mediaId]?.name ?? clip.type : clip.text || "Text";

  const beginDrag = (e: React.PointerEvent, mode: DragMode) => {
    e.stopPropagation();
    storeApi.getState().setSelectedClipId(clip.id);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startMs: clip.startMs,
      mode,
      sourceInMs: isMediaClip(clip) ? clip.sourceInMs : undefined,
      sourceOutMs: isMediaClip(clip) ? clip.sourceOutMs : undefined,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const deltaMs = pxToMs(e.clientX - drag.startX);
    const state = storeApi.getState();

    if (drag.mode === "move") {
      state.moveClip(clip.id, Math.max(0, drag.startMs + deltaMs));
    } else if (drag.mode === "trim-right" && drag.sourceInMs !== undefined && drag.sourceOutMs !== undefined) {
      state.trimClip(clip.id, drag.sourceInMs, drag.sourceOutMs + deltaMs);
    } else if (drag.mode === "trim-left" && drag.sourceInMs !== undefined && drag.sourceOutMs !== undefined) {
      const clampedDelta = Math.max(deltaMs, -drag.sourceInMs);
      state.trimClip(clip.id, drag.sourceInMs + clampedDelta, drag.sourceOutMs);
      state.moveClip(clip.id, Math.max(0, drag.startMs + clampedDelta));
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div
      onPointerDown={(e) => beginDrag(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      style={{ left: msToPx(clip.startMs), width: Math.max(6, msToPx(clip.durationMs)) }}
      className={`absolute top-1.5 bottom-1.5 flex cursor-grab items-center overflow-hidden rounded-sm border px-2 text-[10px] text-white select-none ${
        clip.type === "text" ? "border-warning/60 bg-warning/60" : "border-border/60 bg-primary/70"
      } ${selected ? "ring-2 ring-accent" : ""}`}
    >
      {isMediaClip(clip) && (
        <div
          onPointerDown={(e) => beginDrag(e, "trim-left")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize bg-black/25"
        />
      )}
      <span className="truncate">{label}</span>
      {isMediaClip(clip) && (
        <div
          onPointerDown={(e) => beginDrag(e, "trim-right")}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          className="absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-black/25"
        />
      )}
    </div>
  );
}

function TrackLane({ trackId, clips }: { trackId: string; clips: Clip[] }) {
  const storeApi = useTimelineStoreApi();

  return (
    <div
      style={{ height: TRACK_ROW_HEIGHT }}
      className="relative border-b border-border"
      onPointerDown={() => storeApi.getState().setSelectedClipId(null)}
    >
      {clips.map((clip) => (
        <ClipBlock key={clip.id} clip={clip} />
      ))}
    </div>
  );
}

const Timeline = () => {
  const storeApi = useTimelineStoreApi();
  const tracks = useTimelineStore((s) => s.tracks);
  const clips = useTimelineStore((s) => s.clips);
  const playheadMs = useTimelineStore((s) => s.playheadMs);
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const isPlaying = useTimelineStore((s) => s.isPlaying);

  const rulerRef = useRef<HTMLDivElement>(null);
  const durationMs = Math.max(timelineDurationMs({ clips }), MIN_DURATION_SEC * 1000);
  const totalWidth = msToPx(durationMs) + 200;

  const seekFromClientX = (clientX: number) => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    const ms = Math.max(0, pxToMs(clientX - ruler.getBoundingClientRect().left));
    storeApi.getState().setPlayheadMs(ms);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <button
          onClick={() => storeApi.getState().setIsPlaying(!isPlaying)}
          className="flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-xs hover:border-accent/60"
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          disabled={!selectedClipId}
          onClick={() => selectedClipId && storeApi.getState().splitClip(selectedClipId, playheadMs)}
          className="flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-xs hover:border-accent/60 disabled:opacity-40"
        >
          <Scissors className="h-3 w-3" /> Split
        </button>
        <button
          disabled={!selectedClipId}
          onClick={() => selectedClipId && storeApi.getState().deleteClip(selectedClipId)}
          className="flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-xs hover:border-destructive disabled:opacity-40"
        >
          <Trash2 className="h-3 w-3" /> Delete
        </button>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {(playheadMs / 1000).toFixed(1)}s / {(durationMs / 1000).toFixed(1)}s
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-24 flex-none flex-col border-r border-border">
          <div className="h-6 border-b border-border bg-card" />
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{ height: TRACK_ROW_HEIGHT }}
              className="flex items-center border-b border-border px-2 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              {track.name}
            </div>
          ))}
        </div>

        <div className="relative flex-1 overflow-x-auto overflow-y-auto">
          <div style={{ width: totalWidth }} className="relative">
            <div
              ref={rulerRef}
              onPointerDown={(e) => {
                seekFromClientX(e.clientX);
                (e.currentTarget as Element).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => e.buttons === 1 && seekFromClientX(e.clientX)}
              className="sticky top-0 z-20 h-6 cursor-pointer border-b border-border bg-card"
            />
            <div className="pointer-events-none absolute top-0 z-30 h-full w-px bg-accent" style={{ left: msToPx(playheadMs) }} />

            {tracks.map((track) => (
              <TrackLane key={track.id} trackId={track.id} clips={clips.filter((c) => c.trackId === track.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
