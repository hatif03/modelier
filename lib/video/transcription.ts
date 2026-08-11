"use client";

// On-device speech-to-text with word-level timestamps — ported architecturally from
// freecut's (MIT) local transcription feature, using transformers.js/Whisper directly
// rather than freecut's own Parakeet integration, since that's what's actually
// published and installable. Runs fully in the browser: no audio ever leaves the
// device, matching the client-side processing model chosen for Video Studio.

import type { MediaAsset, Transcript, TranscriptWord } from "@/lib/video-engine/types";
import { decodeAssetAudioMono16k } from "@/lib/video-engine/renderer";

const MODEL_ID = "onnx-community/whisper-tiny.en";

let pipelinePromise: Promise<any> | null = null;

async function getTranscriber() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import("@huggingface/transformers");
      try {
        return await pipeline("automatic-speech-recognition", MODEL_ID, { device: "webgpu", dtype: "fp32" });
      } catch {
        // transformers.js defaults to auto-detecting a device (webgpu first) when
        // none is given — omitting `device` here would just retry the same failing
        // webgpu path instead of actually falling back, so it must be explicit.
        return await pipeline("automatic-speech-recognition", MODEL_ID, { device: "wasm" });
      }
    })();
  }
  return pipelinePromise;
}

export type TranscribeProgress = { status: "loading-model" | "transcribing" | "done" };

export async function transcribeAsset(asset: MediaAsset, onProgress?: (p: TranscribeProgress) => void): Promise<Transcript> {
  onProgress?.({ status: "loading-model" });
  const transcriber = await getTranscriber();

  const samples = await decodeAssetAudioMono16k(asset);
  if (samples.length === 0) {
    return { mediaId: asset.id, words: [] };
  }

  onProgress?.({ status: "transcribing" });
  const result = await transcriber(samples, {
    return_timestamps: "word",
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  const chunks: { text: string; timestamp: [number, number | null] }[] = result?.chunks ?? [];
  const words: TranscriptWord[] = chunks
    .filter((chunk) => chunk.text.trim().length > 0)
    .map((chunk) => ({
      text: chunk.text.trim(),
      startMs: Math.round(chunk.timestamp[0] * 1000),
      endMs: Math.round((chunk.timestamp[1] ?? chunk.timestamp[0] + 0.3) * 1000),
    }));

  onProgress?.({ status: "done" });
  return { mediaId: asset.id, words };
}
