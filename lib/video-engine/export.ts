"use client";

import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Output,
  Mp4OutputFormat,
  QUALITY_HIGH,
  getEncodableAudioCodecs,
  getEncodableVideoCodecs,
} from "mediabunny";

import type { TimelineState } from "./types";
import { timelineDurationMs } from "./types";
import { MediaSinkCache, mixTimelineAudio, renderFrame } from "./renderer";

export type ExportProgress = { renderedFrames: number; totalFrames: number; stage: "video" | "audio" | "finalizing" };

const EXPORT_SAMPLE_RATE = 48000;
const EXPORT_CHANNELS = 2;

// Renders the whole timeline frame-by-frame into an offscreen canvas and encodes
// it with WebCodecs via mediabunny — entirely in the browser, matching freecut's
// (MIT) client-side export model. Returns the finished MP4 as a Blob.
export async function exportTimeline(
  timeline: TimelineState,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const durationMs = timelineDurationMs(timeline);
  if (durationMs <= 0) throw new Error("Nothing on the timeline to export.");

  const canvas = document.createElement("canvas");
  canvas.width = timeline.width;
  canvas.height = timeline.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a 2D rendering context for export.");

  const [videoCodec] = await getEncodableVideoCodecs(["avc", "vp9", "vp8", "av1"], {
    width: timeline.width,
    height: timeline.height,
    quality: QUALITY_HIGH,
  });
  if (!videoCodec) throw new Error("This browser can't encode video — try a recent Chrome or Edge.");

  const audioCodecs = await getEncodableAudioCodecs(["aac", "opus"], {
    numberOfChannels: EXPORT_CHANNELS,
    sampleRate: EXPORT_SAMPLE_RATE,
    quality: QUALITY_HIGH,
  });
  const audioCodec = audioCodecs[0];

  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat(), target });

  const videoSource = new CanvasSource(canvas, { codec: videoCodec, quality: QUALITY_HIGH });
  output.addVideoTrack(videoSource, { frameRate: timeline.fps });

  let audioSource: AudioBufferSource | null = null;
  if (audioCodec) {
    audioSource = new AudioBufferSource({ codec: audioCodec, quality: QUALITY_HIGH });
    output.addAudioTrack(audioSource);
  }

  await output.start();

  const cache = new MediaSinkCache();
  try {
    const frameDurationMs = 1000 / timeline.fps;
    const totalFrames = Math.ceil(durationMs / frameDurationMs);

    for (let frame = 0; frame < totalFrames; frame++) {
      const atMs = frame * frameDurationMs;
      await renderFrame(ctx, timeline, atMs, cache);
      await videoSource.add(atMs / 1000, frameDurationMs / 1000);
      onProgress?.({ renderedFrames: frame + 1, totalFrames, stage: "video" });
    }

    if (audioSource) {
      onProgress?.({ renderedFrames: 0, totalFrames: 1, stage: "audio" });
      const channelsData = await mixTimelineAudio(timeline, cache, durationMs, EXPORT_SAMPLE_RATE, EXPORT_CHANNELS);
      const totalSamples = channelsData[0]?.length ?? 0;
      const chunkSamples = EXPORT_SAMPLE_RATE; // 1-second chunks

      for (let offset = 0; offset < totalSamples; offset += chunkSamples) {
        const length = Math.min(chunkSamples, totalSamples - offset);
        const chunk = new AudioBuffer({ length, numberOfChannels: EXPORT_CHANNELS, sampleRate: EXPORT_SAMPLE_RATE });
        for (let ch = 0; ch < EXPORT_CHANNELS; ch++) {
          chunk.copyToChannel(channelsData[ch].subarray(offset, offset + length), ch);
        }
        await audioSource.add(chunk);
      }
    }

    onProgress?.({ renderedFrames: 1, totalFrames: 1, stage: "finalizing" });
    await output.finalize();
  } catch (err) {
    await output.cancel().catch(() => {});
    throw err;
  } finally {
    cache.dispose();
  }

  if (!target.buffer) throw new Error("Export finished without producing output data.");
  return new Blob([target.buffer], { type: "video/mp4" });
}
