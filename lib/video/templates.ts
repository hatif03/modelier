import { Instagram, Youtube, Facebook, Clapperboard, type LucideIcon } from "lucide-react";

// Video-editor equivalent of lib/formats.ts's FORMATS — actual export pixel
// dimensions (not the "design unit" scale formats.ts uses), since a video's
// output resolution is a real requirement, not a placeholder canvas size.
export type VideoTemplateId =
  | "reel"
  | "short"
  | "youtube_shorts"
  | "youtube"
  | "facebook_feed"
  | "facebook_story"
  | "general";

export type VideoTemplate = {
  id: VideoTemplateId;
  label: string;
  aspectLabel: string;
  width: number;
  height: number;
  fps: number;
  /** Suggested duration range in seconds — advisory, never enforced by the editor. */
  minDurationSec: number;
  maxDurationSec: number | null;
  /** Starter pacing markers (as a fraction of total duration) auto-assembly and the
   * timeline ruler use to suggest where a hook/CTA should land — not a fixed layout. */
  pacing: { hookEndsAt: number; ctaStartsAt: number };
  captionStyle: "bold-word-highlight" | "lower-third";
  icon: LucideIcon;
};

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: "reel",
    label: "Instagram Reel",
    aspectLabel: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    minDurationSec: 3,
    maxDurationSec: 90,
    pacing: { hookEndsAt: 0.08, ctaStartsAt: 0.85 },
    captionStyle: "bold-word-highlight",
    icon: Instagram,
  },
  {
    id: "short",
    label: "Short-Form Video",
    aspectLabel: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    minDurationSec: 3,
    maxDurationSec: 60,
    pacing: { hookEndsAt: 0.1, ctaStartsAt: 0.85 },
    captionStyle: "bold-word-highlight",
    icon: Clapperboard,
  },
  {
    id: "youtube_shorts",
    label: "YouTube Shorts",
    aspectLabel: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    minDurationSec: 3,
    maxDurationSec: 60,
    pacing: { hookEndsAt: 0.1, ctaStartsAt: 0.85 },
    captionStyle: "bold-word-highlight",
    icon: Youtube,
  },
  {
    id: "youtube",
    label: "YouTube (Long-Form)",
    aspectLabel: "16:9",
    width: 1920,
    height: 1080,
    fps: 30,
    minDurationSec: 30,
    maxDurationSec: null,
    pacing: { hookEndsAt: 0.03, ctaStartsAt: 0.92 },
    captionStyle: "lower-third",
    icon: Youtube,
  },
  {
    id: "facebook_feed",
    label: "Facebook Feed",
    aspectLabel: "4:5",
    width: 1080,
    height: 1350,
    fps: 30,
    minDurationSec: 3,
    maxDurationSec: 120,
    pacing: { hookEndsAt: 0.08, ctaStartsAt: 0.85 },
    captionStyle: "lower-third",
    icon: Facebook,
  },
  {
    id: "facebook_story",
    label: "Facebook Story",
    aspectLabel: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    minDurationSec: 3,
    maxDurationSec: 20,
    pacing: { hookEndsAt: 0.1, ctaStartsAt: 0.8 },
    captionStyle: "bold-word-highlight",
    icon: Facebook,
  },
  {
    id: "general",
    label: "General / Marketing",
    aspectLabel: "16:9",
    width: 1920,
    height: 1080,
    fps: 30,
    minDurationSec: 3,
    maxDurationSec: null,
    pacing: { hookEndsAt: 0.05, ctaStartsAt: 0.9 },
    captionStyle: "lower-third",
    icon: Clapperboard,
  },
];

export function getVideoTemplate(id: string | null | undefined): VideoTemplate | undefined {
  return VIDEO_TEMPLATES.find((t) => t.id === id);
}
