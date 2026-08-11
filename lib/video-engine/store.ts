"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import { v4 as uuidv4 } from "uuid";

import type {
  Clip,
  ColorGradePresetId,
  MediaAsset,
  MediaClip,
  TextClip,
  Track,
  TrackKind,
  Transcript,
  TimelineState,
} from "./types";
import { isMediaClip, timelineDurationMs } from "./types";

type UndoableState = TimelineState;

type PlaybackState = {
  playheadMs: number;
  selectedClipId: string | null;
  isPlaying: boolean;
};

type Actions = {
  loadTimeline: (state: TimelineState) => void;
  serialize: () => TimelineState;

  addMedia: (asset: MediaAsset) => void;
  setTranscript: (mediaId: string, transcript: Transcript) => void;

  ensureTrack: (kind: TrackKind) => string;
  addTrack: (kind: TrackKind, name?: string) => string;
  removeTrack: (trackId: string) => void;

  appendMediaClip: (mediaId: string, opts?: { trackId?: string }) => string;
  addTextClip: (input: {
    trackId?: string;
    text: string;
    style: TextClip["style"];
    startMs: number;
    durationMs: number;
    words?: TextClip["words"];
  }) => string;

  moveClip: (clipId: string, startMs: number, trackId?: string) => void;
  trimClip: (clipId: string, sourceInMs: number, sourceOutMs: number) => void;
  splitClip: (clipId: string, atMs: number) => void;
  deleteClip: (clipId: string) => void;
  setClipVolume: (clipId: string, volume: number) => void;
  setColorGrade: (clipId: string, presetId: ColorGradePresetId | null) => void;

  replaceClips: (clips: Clip[]) => void;
  addClips: (clips: Clip[]) => void;

  setPlayheadMs: (ms: number) => void;
  setSelectedClipId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;

  durationMs: () => number;
};

export type TimelineStore = TimelineState & PlaybackState & Actions;

const TRACK_LABEL: Record<TrackKind, string> = {
  video: "Video",
  audio: "Audio",
  caption: "Captions",
  overlay: "Overlays",
};

function emptyTimeline(templateId: string, width: number, height: number, fps: number): TimelineState {
  return {
    templateId,
    width,
    height,
    fps,
    tracks: [{ id: uuidv4(), kind: "video", name: TRACK_LABEL.video }],
    clips: [],
    media: {},
    transcripts: {},
  };
}

export function createTimelineStore(templateId: string, width: number, height: number, fps: number) {
  return create<TimelineStore>()(
    temporal(
      (set, get) => ({
        ...emptyTimeline(templateId, width, height, fps),
        playheadMs: 0,
        selectedClipId: null,
        isPlaying: false,

        loadTimeline: (state) => set(() => ({ ...state, playheadMs: 0, selectedClipId: null, isPlaying: false })),
        serialize: () => {
          const { templateId, width, height, fps, tracks, clips, media, transcripts } = get();
          return { templateId, width, height, fps, tracks, clips, media, transcripts };
        },

        addMedia: (asset) => set((s) => ({ media: { ...s.media, [asset.id]: asset } })),
        setTranscript: (mediaId, transcript) =>
          set((s) => ({ transcripts: { ...s.transcripts, [mediaId]: transcript } })),

        ensureTrack: (kind) => {
          const existing = get().tracks.find((t) => t.kind === kind);
          if (existing) return existing.id;
          return get().addTrack(kind);
        },
        addTrack: (kind, name) => {
          const id = uuidv4();
          set((s) => ({ tracks: [...s.tracks, { id, kind, name: name ?? TRACK_LABEL[kind] }] }));
          return id;
        },
        removeTrack: (trackId) =>
          set((s) => ({
            tracks: s.tracks.filter((t) => t.id !== trackId),
            clips: s.clips.filter((c) => c.trackId !== trackId),
          })),

        appendMediaClip: (mediaId, opts) => {
          const s = get();
          const asset = s.media[mediaId];
          if (!asset) throw new Error(`Unknown media asset: ${mediaId}`);

          const trackKind: TrackKind = asset.kind === "audio" ? "audio" : "video";
          const trackId = opts?.trackId ?? s.ensureTrack(trackKind);
          const trackClips = s.clips.filter((c) => c.trackId === trackId);
          const startMs = trackClips.reduce((max, c) => Math.max(max, c.startMs + c.durationMs), 0);
          const durationMs = asset.kind === "image" ? 5000 : asset.durationMs;

          const clip: MediaClip = {
            id: uuidv4(),
            trackId,
            type: asset.kind,
            mediaId,
            startMs,
            durationMs,
            sourceInMs: 0,
            sourceOutMs: durationMs,
            volume: 1,
            colorGradePresetId: null,
          };
          set((state) => ({ clips: [...state.clips, clip] }));
          return clip.id;
        },

        addTextClip: ({ trackId, text, style, startMs, durationMs, words }) => {
          const resolvedTrackId = trackId ?? get().ensureTrack("caption");
          const clip: TextClip = {
            id: uuidv4(),
            trackId: resolvedTrackId,
            type: "text",
            text,
            style,
            startMs,
            durationMs,
            words: words ?? [],
          };
          set((s) => ({ clips: [...s.clips, clip] }));
          return clip.id;
        },

        moveClip: (clipId, startMs, trackId) =>
          set((s) => ({
            clips: s.clips.map((c) =>
              c.id === clipId ? { ...c, startMs: Math.max(0, startMs), trackId: trackId ?? c.trackId } : c
            ),
          })),

        trimClip: (clipId, sourceInMs, sourceOutMs) =>
          set((s) => ({
            clips: s.clips.map((c) => {
              if (c.id !== clipId || !isMediaClip(c)) return c;
              const clampedIn = Math.max(0, sourceInMs);
              const clampedOut = Math.max(clampedIn + 1, sourceOutMs);
              return { ...c, sourceInMs: clampedIn, sourceOutMs: clampedOut, durationMs: clampedOut - clampedIn };
            }),
          })),

        splitClip: (clipId, atMs) => {
          const clip = get().clips.find((c) => c.id === clipId);
          if (!clip) return;
          const offset = atMs - clip.startMs;
          if (offset <= 0 || offset >= clip.durationMs) return;

          const left: Clip = { ...clip, durationMs: offset };
          const right: Clip = isMediaClip(clip)
            ? {
                ...clip,
                id: uuidv4(),
                startMs: atMs,
                durationMs: clip.durationMs - offset,
                sourceInMs: clip.sourceInMs + offset,
              }
            : { ...clip, id: uuidv4(), startMs: atMs, durationMs: clip.durationMs - offset };

          set((s) => ({ clips: s.clips.flatMap((c) => (c.id === clipId ? [left, right] : [c])) }));
        },

        deleteClip: (clipId) => set((s) => ({ clips: s.clips.filter((c) => c.id !== clipId) })),

        setClipVolume: (clipId, volume) =>
          set((s) => ({
            clips: s.clips.map((c) => (c.id === clipId && isMediaClip(c) ? { ...c, volume } : c)),
          })),

        setColorGrade: (clipId, presetId) =>
          set((s) => ({
            clips: s.clips.map((c) => (c.id === clipId && isMediaClip(c) ? { ...c, colorGradePresetId: presetId } : c)),
          })),

        replaceClips: (clips) => set({ clips }),
        addClips: (newClips) => set((s) => ({ clips: [...s.clips, ...newClips] })),

        setPlayheadMs: (ms) => set({ playheadMs: Math.max(0, ms) }),
        setSelectedClipId: (id) => set({ selectedClipId: id }),
        setIsPlaying: (playing) => set({ isPlaying: playing }),

        durationMs: () => timelineDurationMs(get()),
      }),
      {
        partialize: (s) => ({
          templateId: s.templateId,
          width: s.width,
          height: s.height,
          fps: s.fps,
          tracks: s.tracks,
          clips: s.clips,
          media: s.media,
          transcripts: s.transcripts,
        }),
        limit: 100,
      }
    )
  );
}
