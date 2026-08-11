// Core timeline data model for Video Studio. Architecturally modeled on freecut
// (https://github.com/walterlow/freecut, MIT) — a simplified, right-sized subset for
// v1 rather than a literal port of its multi-hundred-module engine: one clip per
// track/kind, millisecond timestamps, no compound clips/masks/lottie yet.

export type MediaKind = "video" | "audio" | "image";

// A source file the user imported. Persisted to OPFS (see lib/video-engine/storage.ts)
// so it survives a reload without re-uploading — `url` is the current session's blob:
// URL over that OPFS file, re-created on load.
export type MediaAsset = {
  id: string;
  kind: MediaKind;
  name: string;
  url: string;
  durationMs: number; // 0 for image
  width?: number;
  height?: number;
  thumbnailUrl?: string;
};

export type ClipBase = {
  id: string;
  trackId: string;
  startMs: number; // position on the timeline
  durationMs: number; // on-timeline duration
};

export type MediaClip = ClipBase & {
  type: "video" | "audio" | "image";
  mediaId: string;
  sourceInMs: number; // trim in-point within the source media
  sourceOutMs: number; // trim out-point within the source media
  volume: number; // 0..1
  colorGradePresetId?: string | null;
};

export type CaptionWord = { text: string; startMs: number; endMs: number };

export type TextClip = ClipBase & {
  type: "text";
  text: string;
  style: "bold-word-highlight" | "lower-third" | "plain";
  // Word-level timing drives the karaoke-style highlight; empty for a manual overlay.
  words: CaptionWord[];
};

export type Clip = MediaClip | TextClip;

export type TrackKind = "video" | "audio" | "caption" | "overlay";

export type Track = {
  id: string;
  kind: TrackKind;
  name: string;
  muted?: boolean;
  hidden?: boolean;
};

export type TranscriptWord = { text: string; startMs: number; endMs: number };
export type Transcript = { mediaId: string; words: TranscriptWord[]; language?: string };

export type ColorGradePresetId = "none" | "warm" | "cool" | "cinematic" | "vibrant" | "mono";

export type TimelineState = {
  templateId: string;
  width: number;
  height: number;
  fps: number;
  tracks: Track[];
  clips: Clip[];
  media: Record<string, MediaAsset>;
  transcripts: Record<string, Transcript>;
};

export function isMediaClip(clip: Clip): clip is MediaClip {
  return clip.type === "video" || clip.type === "audio" || clip.type === "image";
}

export function isTextClip(clip: Clip): clip is TextClip {
  return clip.type === "text";
}

export function timelineDurationMs(state: Pick<TimelineState, "clips">): number {
  return state.clips.reduce((max, clip) => Math.max(max, clip.startMs + clip.durationMs), 0);
}
