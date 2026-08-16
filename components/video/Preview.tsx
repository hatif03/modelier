"use client";

import { useEffect, useRef } from "react";

import { useTimelineStore, useTimelineStoreApi } from "@/lib/video-engine/context";
import { MediaSinkCache, renderFrame } from "@/lib/video-engine/renderer";
import { timelineDurationMs } from "@/lib/video-engine/types";

const THUMBNAIL_DEBOUNCE_MS = 3000;

const Preview = ({ projectId }: { projectId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<MediaSinkCache | null>(null);
  const storeApi = useTimelineStoreApi();
  const width = useTimelineStore((s) => s.width);
  const height = useTimelineStore((s) => s.height);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const thumbnailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced a few seconds after each redraw so the Dashboard shows a real
  // preview of this project instead of a blank tile — Video Studio never had
  // this wired up before (unlike the canvas editor and Jewelry CAD Studio,
  // which both already capture a thumbnail on every meaningful change/save).
  const scheduleThumbnailCapture = () => {
    if (thumbnailTimer.current) clearTimeout(thumbnailTimer.current);
    thumbnailTimer.current = setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const blob = await (await fetch(dataUrl)).blob();
        const form = new FormData();
        form.set("thumbnail", blob, "thumbnail.png");
        await fetch(`/api/video-projects/${projectId}/thumbnail`, { method: "PUT", body: form });
      } catch {
        // Best-effort — a failed thumbnail capture shouldn't disrupt editing.
      }
    }, THUMBNAIL_DEBOUNCE_MS);
  };

  useEffect(() => {
    cacheRef.current = new MediaSinkCache();
    return () => cacheRef.current?.dispose();
  }, []);

  const draw = async (atMs: number) => {
    const canvas = canvasRef.current;
    const cache = cacheRef.current;
    if (!canvas || !cache) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    try {
      await renderFrame(ctx, storeApi.getState(), atMs, cache);
    } catch {
      // Best-effort — a bad frame shouldn't crash the editing session.
    }
  };

  // Redraw on any change that affects what's on screen — scrubbing the playhead,
  // editing the timeline, or the playback clock below advancing it.
  useEffect(() => {
    const unsubscribe = storeApi.subscribe((state, prev) => {
      if (state.playheadMs === prev.playheadMs && state.clips === prev.clips && state.tracks === prev.tracks) return;
      draw(state.playheadMs);
      // Only re-capture the thumbnail on real edits (clips/tracks changed),
      // not on every scrub/playback tick — those just move the playhead.
      if (state.clips !== prev.clips || state.tracks !== prev.tracks) scheduleThumbnailCapture();
    });
    draw(storeApi.getState().playheadMs).then(scheduleThumbnailCapture);
    return () => {
      unsubscribe();
      if (thumbnailTimer.current) clearTimeout(thumbnailTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const state = storeApi.getState();
      const duration = timelineDurationMs(state);
      const next = state.playheadMs + dt;
      if (next >= duration) {
        state.setPlayheadMs(0);
        state.setIsPlaying(false);
        return;
      }
      state.setPlayheadMs(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, storeApi]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="max-h-full max-w-full border border-border/50 bg-black shadow-panel"
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  );
};

export default Preview;
