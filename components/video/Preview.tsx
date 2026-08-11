"use client";

import { useEffect, useRef } from "react";

import { useTimelineStore, useTimelineStoreApi } from "@/lib/video-engine/context";
import { MediaSinkCache, renderFrame } from "@/lib/video-engine/renderer";
import { timelineDurationMs } from "@/lib/video-engine/types";

const Preview = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<MediaSinkCache | null>(null);
  const storeApi = useTimelineStoreApi();
  const width = useTimelineStore((s) => s.width);
  const height = useTimelineStore((s) => s.height);
  const isPlaying = useTimelineStore((s) => s.isPlaying);

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
    await renderFrame(ctx, storeApi.getState(), atMs, cache);
  };

  // Redraw on any change that affects what's on screen — scrubbing the playhead,
  // editing the timeline, or the playback clock below advancing it.
  useEffect(() => {
    const unsubscribe = storeApi.subscribe((state, prev) => {
      if (state.playheadMs === prev.playheadMs && state.clips === prev.clips && state.tracks === prev.tracks) return;
      draw(state.playheadMs);
    });
    draw(storeApi.getState().playheadMs);
    return unsubscribe;
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
