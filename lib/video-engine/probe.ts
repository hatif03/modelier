"use client";

import { ALL_FORMATS, BlobSource, CanvasSink, Input } from "mediabunny";

import type { MediaAsset, MediaKind } from "./types";

function kindFromMimeType(mimeType: string): MediaKind {
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  return "video";
}

// Reads duration/dimensions/a thumbnail out of an imported file using mediabunny's
// WebCodecs-backed demuxer — no upload, everything stays in the browser.
export async function probeMedia(file: File): Promise<Omit<MediaAsset, "id" | "url">> {
  const kind = kindFromMimeType(file.type);

  if (kind === "image") {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(320, bitmap.width);
    canvas.height = Math.round(canvas.width * (bitmap.height / bitmap.width));
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return {
      kind,
      name: file.name,
      durationMs: 0,
      width: bitmap.width,
      height: bitmap.height,
      thumbnailUrl: canvas.toDataURL("image/jpeg", 0.8),
    };
  }

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const durationSec = await input.computeDuration();
  const videoTrack = await input.getPrimaryVideoTrack();

  let width: number | undefined;
  let height: number | undefined;
  let thumbnailUrl: string | undefined;

  if (videoTrack) {
    width = await videoTrack.getDisplayWidth();
    height = await videoTrack.getDisplayHeight();
    const sink = new CanvasSink(videoTrack, { width: 320, fit: "contain" });
    const wrapped = await sink.getCanvas(Math.min(0.5, durationSec / 2));
    if (wrapped) {
      const canvas = wrapped.canvas as HTMLCanvasElement;
      thumbnailUrl = canvas.toDataURL ? canvas.toDataURL("image/jpeg", 0.8) : undefined;
    }
  }

  input.dispose();

  return {
    kind: videoTrack ? "video" : "audio",
    name: file.name,
    durationMs: Math.round(durationSec * 1000),
    width,
    height,
    thumbnailUrl,
  };
}
