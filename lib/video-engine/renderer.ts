"use client";

// Shared frame/audio compositor used by both the live preview player and the
// export pipeline (lib/video-engine/export.ts) — one code path renders a
// timeline, so preview and export can never visually disagree.

import { ALL_FORMATS, AudioBufferSink, BlobSource, CanvasSink, Input, type InputAudioTrack, type InputVideoTrack } from "mediabunny";

import { getColorGradeFilter } from "@/lib/video/colorGrade";
import type { Clip, MediaAsset, MediaClip, TextClip, TimelineState } from "./types";
import { isMediaClip, isTextClip } from "./types";
import { loadMediaFile } from "./storage";

async function fileForAsset(asset: MediaAsset): Promise<File | Blob> {
  const fromOpfs = await loadMediaFile(asset.id);
  if (fromOpfs) return fromOpfs;
  const res = await fetch(asset.url);
  return await res.blob();
}

type SourceHandles = {
  input: Input;
  canvasSink?: CanvasSink;
  audioSink?: AudioBufferSink;
};

// Opens each media asset's decoder once and reuses it across every frame/sample
// request for the lifetime of an editing or export session.
export class MediaSinkCache {
  private handles = new Map<string, Promise<SourceHandles | null>>();
  private images = new Map<string, Promise<ImageBitmap | null>>();

  // Returns null (rather than a rejected promise) when the source file can't be
  // recovered — e.g. its OPFS copy is missing and its blob: URL was scoped to a
  // browser session that's since closed (opening a project on a different
  // device/browser, or after clearing site data, hits this legitimately).
  async getHandles(asset: MediaAsset, targetWidth: number, targetHeight: number): Promise<SourceHandles | null> {
    const key = asset.id;
    let promise = this.handles.get(key);
    if (!promise) {
      promise = this.open(asset, targetWidth, targetHeight).catch(() => null);
      this.handles.set(key, promise);
    }
    return promise;
  }

  async getImage(asset: MediaAsset): Promise<ImageBitmap | null> {
    let promise = this.images.get(asset.id);
    if (!promise) {
      promise = fileForAsset(asset).then((file) => createImageBitmap(file)).catch(() => null);
      this.images.set(asset.id, promise);
    }
    return promise;
  }

  private async open(asset: MediaAsset, targetWidth: number, targetHeight: number): Promise<SourceHandles> {
    const file = await fileForAsset(asset);
    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
    const videoTrack: InputVideoTrack | null = asset.kind === "video" ? await input.getPrimaryVideoTrack() : null;
    const audioTrack: InputAudioTrack | null = asset.kind !== "image" ? await input.getPrimaryAudioTrack() : null;
    return {
      input,
      canvasSink: videoTrack
        ? new CanvasSink(videoTrack, { width: targetWidth, height: targetHeight, fit: "cover" })
        : undefined,
      audioSink: audioTrack ? new AudioBufferSink(audioTrack) : undefined,
    };
  }

  dispose() {
    for (const p of this.handles.values()) p.then((h) => h?.input.dispose()).catch(() => {});
    this.handles.clear();
    this.images.clear();
  }
}

function drawUnavailablePlaceholder(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `${Math.round(h * 0.03)}px system-ui, sans-serif`;
  ctx.fillText("Media unavailable on this device — re-import this clip", w / 2, h / 2);
}

function activeClip(clips: Clip[], trackId: string, atMs: number): Clip | undefined {
  return clips.find((c) => c.trackId === trackId && atMs >= c.startMs && atMs < c.startMs + c.durationMs);
}

function drawTextClip(ctx: CanvasRenderingContext2D, clip: TextClip, atMs: number, w: number, h: number) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (clip.style === "lower-third" || clip.style === "plain") {
    const fontSize = Math.round(h * (clip.style === "lower-third" ? 0.035 : 0.05));
    ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
    const y = clip.style === "lower-third" ? h * 0.88 : h * 0.5;
    const metrics = ctx.measureText(clip.text);
    const padX = fontSize * 0.9;
    const padY = fontSize * 0.55;
    if (clip.style === "lower-third") {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(w / 2 - metrics.width / 2 - padX, y - padY - fontSize / 2, metrics.width + padX * 2, fontSize + padY * 2);
    }
    ctx.fillStyle = "white";
    ctx.fillText(clip.text, w / 2, y);
    return;
  }

  // bold-word-highlight — karaoke-style captions, current word picked out.
  const words = clip.words.length > 0 ? clip.words : [{ text: clip.text, startMs: clip.startMs, endMs: clip.startMs + clip.durationMs }];
  const fontSize = Math.round(h * 0.055);
  ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
  const y = h * 0.82;
  const gap = fontSize * 0.28;
  const widths = words.map((word) => ctx.measureText(word.text).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, words.length - 1);
  let x = w / 2 - totalWidth / 2;
  words.forEach((word, i) => {
    const active = atMs >= word.startMs && atMs < word.endMs;
    const cx = x + widths[i] / 2;
    ctx.lineWidth = fontSize * 0.12;
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.strokeText(word.text, cx, y);
    ctx.fillStyle = active ? "#ffde59" : "white";
    ctx.fillText(word.text, cx, y);
    x += widths[i] + gap;
  });
}

export async function renderFrame(
  ctx: CanvasRenderingContext2D,
  timeline: Pick<TimelineState, "clips" | "tracks" | "media" | "width" | "height">,
  atMs: number,
  cache: MediaSinkCache
): Promise<void> {
  const { width, height } = timeline;
  ctx.save();
  ctx.filter = "none";
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  const videoTrackIds = timeline.tracks.filter((t) => t.kind === "video" && !t.hidden).map((t) => t.id);
  for (const trackId of videoTrackIds) {
    const clip = activeClip(timeline.clips, trackId, atMs);
    if (!clip || !isMediaClip(clip)) continue;
    const asset = timeline.media[clip.mediaId];
    if (!asset) continue;

    ctx.filter = getColorGradeFilter(clip.colorGradePresetId);

    if (asset.kind === "image") {
      const bitmap = await cache.getImage(asset);
      if (!bitmap) {
        drawUnavailablePlaceholder(ctx, width, height);
        ctx.filter = "none";
        continue;
      }
      const scale = Math.max(width / bitmap.width, height / bitmap.height);
      const dw = bitmap.width * scale;
      const dh = bitmap.height * scale;
      ctx.drawImage(bitmap, (width - dw) / 2, (height - dh) / 2, dw, dh);
    } else {
      const handles = await cache.getHandles(asset, width, height);
      if (!handles?.canvasSink) {
        drawUnavailablePlaceholder(ctx, width, height);
        ctx.filter = "none";
        continue;
      }
      const sourceSec = (clip.sourceInMs + (atMs - clip.startMs)) / 1000;
      const wrapped = await handles.canvasSink.getCanvas(sourceSec);
      if (wrapped) ctx.drawImage(wrapped.canvas, 0, 0, width, height);
    }
    ctx.filter = "none";
  }

  const overlayTrackIds = timeline.tracks
    .filter((t) => (t.kind === "overlay" || t.kind === "caption") && !t.hidden)
    .map((t) => t.id);
  for (const trackId of overlayTrackIds) {
    const clip = activeClip(timeline.clips, trackId, atMs);
    if (clip && isTextClip(clip)) drawTextClip(ctx, clip, atMs, width, height);
  }

  ctx.restore();
}

export async function resampleBuffer(buffer: AudioBuffer, targetSampleRate: number, targetChannels: number): Promise<AudioBuffer> {
  if (buffer.sampleRate === targetSampleRate && buffer.numberOfChannels === targetChannels) return buffer;
  const durationSec = buffer.duration;
  const offlineCtx = new OfflineAudioContext(targetChannels, Math.ceil(durationSec * targetSampleRate) + 1, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start();
  return await offlineCtx.startRendering();
}

// Decodes an asset's entire audio track down to mono 16kHz samples — the input
// shape Whisper-family ASR models expect (see lib/video/transcription.ts).
export async function decodeAssetAudioMono16k(asset: MediaAsset): Promise<Float32Array> {
  const file = await fileForAsset(asset);
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const audioTrack = await input.getPrimaryAudioTrack();
    if (!audioTrack) return new Float32Array(0);

    const sink = new AudioBufferSink(audioTrack);
    const chunks: Float32Array[] = [];
    for await (const wrapped of sink.buffers()) {
      const mono = await resampleBuffer(wrapped.buffer, 16000, 1);
      chunks.push(mono.getChannelData(0).slice());
    }
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const out = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  } finally {
    input.dispose();
  }
}

// Mixes every audio-contributing clip (dedicated audio tracks + video clips' own
// embedded audio) into one sample-accurate buffer spanning the whole timeline,
// silence-padded across gaps — AudioBufferSource only supports strictly sequential
// buffers, so the mix has to be pre-flattened before handing it off for encoding.
export async function mixTimelineAudio(
  timeline: Pick<TimelineState, "clips" | "media">,
  cache: MediaSinkCache,
  totalDurationMs: number,
  sampleRate = 48000,
  numberOfChannels = 2
): Promise<Float32Array<ArrayBuffer>[]> {
  const totalSamples = Math.max(1, Math.ceil((totalDurationMs / 1000) * sampleRate));
  const channelsData: Float32Array<ArrayBuffer>[] = Array.from({ length: numberOfChannels }, () => new Float32Array(totalSamples));

  const audioClips = timeline.clips.filter((c) => isMediaClip(c) && c.type !== "image" && c.volume > 0) as MediaClip[];

  for (const clip of audioClips) {
    const asset = timeline.media[clip.mediaId];
    if (!asset) continue;
    const handles = await cache.getHandles(asset, 2, 2);
    if (!handles?.audioSink) continue;

    const startSec = clip.sourceInMs / 1000;
    const endSec = clip.sourceOutMs / 1000;

    for await (const wrapped of handles.audioSink.buffers(startSec, endSec)) {
      const resampled = await resampleBuffer(wrapped.buffer, sampleRate, numberOfChannels);
      const bufferOffsetIntoClipMs = wrapped.timestamp * 1000 - clip.sourceInMs;
      const outputStartSample = Math.round(((clip.startMs + bufferOffsetIntoClipMs) / 1000) * sampleRate);

      for (let ch = 0; ch < numberOfChannels; ch++) {
        const data = resampled.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
          const idx = outputStartSample + i;
          if (idx < 0 || idx >= totalSamples) continue;
          channelsData[ch][idx] += data[i] * clip.volume;
        }
      }
    }
  }

  for (const data of channelsData) {
    for (let i = 0; i < data.length; i++) data[i] = Math.max(-1, Math.min(1, data[i]));
  }

  return channelsData;
}
