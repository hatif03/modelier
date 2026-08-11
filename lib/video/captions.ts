import { v4 as uuidv4 } from "uuid";

import type { TextClip, Transcript } from "@/lib/video-engine/types";

export type CaptionOptions = { maxWordsPerCue?: number; maxCueDurationMs?: number };

// Chunks a transcript into short caption cues and turns each into a TextClip on
// the caption track, offset to line up with where the source clip actually sits
// on the timeline.
export function buildCaptionClips(
  transcript: Transcript,
  trackId: string,
  style: TextClip["style"],
  clip: { startMs: number; sourceInMs: number; sourceOutMs: number },
  options: CaptionOptions = {}
): TextClip[] {
  const maxWords = options.maxWordsPerCue ?? (style === "bold-word-highlight" ? 4 : 10);
  const maxDuration = options.maxCueDurationMs ?? 3500;
  const offsetMs = clip.startMs - clip.sourceInMs;

  const words = transcript.words.filter((w) => w.startMs >= clip.sourceInMs && w.startMs < clip.sourceOutMs);
  const cues: TextClip[] = [];
  let bucket: typeof words = [];

  const flush = () => {
    if (bucket.length === 0) return;
    const first = bucket[0];
    const last = bucket[bucket.length - 1];
    cues.push({
      id: uuidv4(),
      trackId,
      type: "text",
      text: bucket.map((w) => w.text).join(" "),
      style,
      startMs: first.startMs + offsetMs,
      durationMs: last.endMs - first.startMs,
      words: bucket.map((w) => ({ text: w.text, startMs: w.startMs + offsetMs, endMs: w.endMs + offsetMs })),
    });
    bucket = [];
  };

  for (const word of words) {
    if (bucket.length > 0) {
      const wouldSpan = word.endMs - bucket[0].startMs;
      if (bucket.length >= maxWords || wouldSpan > maxDuration) flush();
    }
    bucket.push(word);
  }
  flush();

  return cues;
}
