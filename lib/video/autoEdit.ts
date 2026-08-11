import { v4 as uuidv4 } from "uuid";

import type { Clip, MediaClip, Transcript } from "@/lib/video-engine/types";

// Rebuilds video-use's (MIT) core feature — silence-gap and filler-word jump
// cuts — as deterministic TypeScript against our own transcript/timeline model,
// rather than shelling out to ffmpeg the way video-use's Python CLI agent does.

export type AutoEditOptions = {
  /** A gap between spoken words longer than this is cut as dead air. */
  minSilenceGapMs?: number;
  fillerWords?: string[];
  /** Kept around each spoken segment's edges so a cut doesn't clip a syllable. */
  paddingMs?: number;
};

const DEFAULT_FILLERS = ["um", "umm", "uh", "uhh", "erm", "hmm", "mhm", "mm"];

export type KeepRange = { sourceInMs: number; sourceOutMs: number };

export function computeAutoEditPlan(
  transcript: Transcript,
  clipSourceInMs: number,
  clipSourceOutMs: number,
  options: AutoEditOptions = {}
): KeepRange[] {
  const minGap = options.minSilenceGapMs ?? 700;
  const fillers = new Set((options.fillerWords ?? DEFAULT_FILLERS).map((w) => w.toLowerCase()));
  const padding = options.paddingMs ?? 80;

  const words = transcript.words
    .filter((w) => w.endMs > clipSourceInMs && w.startMs < clipSourceOutMs)
    .filter((w) => !fillers.has(w.text.toLowerCase().replace(/[^a-z']/g, "")))
    .sort((a, b) => a.startMs - b.startMs);

  if (words.length === 0) return [{ sourceInMs: clipSourceInMs, sourceOutMs: clipSourceOutMs }];

  const ranges: KeepRange[] = [];
  let rangeStart = Math.max(clipSourceInMs, words[0].startMs - padding);
  let rangeEnd = Math.min(clipSourceOutMs, words[0].endMs + padding);

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const gap = word.startMs - rangeEnd;
    if (gap > minGap) {
      ranges.push({ sourceInMs: rangeStart, sourceOutMs: rangeEnd });
      rangeStart = Math.max(clipSourceInMs, word.startMs - padding);
    }
    rangeEnd = Math.min(clipSourceOutMs, word.endMs + padding);
  }
  ranges.push({ sourceInMs: rangeStart, sourceOutMs: rangeEnd });

  return ranges.filter((r) => r.sourceOutMs - r.sourceInMs > 0);
}

function buildJumpCutClips(original: MediaClip, keepRanges: KeepRange[]): MediaClip[] {
  let cursor = original.startMs;
  return keepRanges.map((range) => {
    const clip: MediaClip = {
      ...original,
      id: uuidv4(),
      startMs: cursor,
      durationMs: range.sourceOutMs - range.sourceInMs,
      sourceInMs: range.sourceInMs,
      sourceOutMs: range.sourceOutMs,
    };
    cursor += clip.durationMs;
    return clip;
  });
}

// Replaces `original` with one clip per kept range (silence/filler gaps removed)
// and shifts every later clip on the SAME track left to close the gap. Clips on
// other tracks (e.g. a music bed or captions added before this ran) are left in
// place — run auto-edit before adding captions so they land on the cut result.
export function applyAutoEdit(allClips: Clip[], original: MediaClip, keepRanges: KeepRange[]): Clip[] {
  const newClips = buildJumpCutClips(original, keepRanges);
  const newTotalMs = newClips.reduce((sum, c) => sum + c.durationMs, 0);
  const removedMs = original.durationMs - newTotalMs;

  const rest = allClips
    .filter((c) => c.id !== original.id)
    .map((c) =>
      c.trackId === original.trackId && c.startMs >= original.startMs + original.durationMs
        ? { ...c, startMs: c.startMs - removedMs }
        : c
    );

  return [...rest, ...newClips].sort((a, b) => a.startMs - b.startMs);
}
