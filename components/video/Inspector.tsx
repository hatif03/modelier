"use client";

import { useTimelineStore, useTimelineStoreApi } from "@/lib/video-engine/context";
import { isMediaClip, isTextClip, type ColorGradePresetId } from "@/lib/video-engine/types";
import { COLOR_GRADE_PRESETS } from "@/lib/video/colorGrade";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Inspector = () => {
  const storeApi = useTimelineStoreApi();
  const selectedClipId = useTimelineStore((s) => s.selectedClipId);
  const clip = useTimelineStore((s) => s.clips.find((c) => c.id === s.selectedClipId));
  const media = useTimelineStore((s) => s.media);

  if (!selectedClipId || !clip) {
    return <p className="p-3 text-xs text-muted-foreground">Select a clip on the timeline to edit it.</p>;
  }

  if (isMediaClip(clip)) {
    const asset = media[clip.mediaId];
    return (
      <div className="flex flex-col gap-4 p-3">
        <div>
          <p className="text-xs font-medium text-foreground">{asset?.name ?? clip.type}</p>
          <p className="text-[10px] text-muted-foreground">
            {(clip.durationMs / 1000).toFixed(2)}s on timeline · trimmed {(clip.sourceInMs / 1000).toFixed(2)}s–
            {(clip.sourceOutMs / 1000).toFixed(2)}s of source
          </p>
        </div>

        {clip.type !== "image" && (
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Volume</label>
            <Slider
              value={[Math.round(clip.volume * 100)]}
              max={100}
              step={1}
              onValueChange={([v]) => storeApi.getState().setClipVolume(clip.id, v / 100)}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color grade</label>
          <Select
            value={clip.colorGradePresetId ?? "none"}
            onValueChange={(value) => storeApi.getState().setColorGrade(clip.id, value as ColorGradePresetId)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLOR_GRADE_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (isTextClip(clip)) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Text</label>
        <textarea
          value={clip.text}
          onChange={(e) =>
            storeApi.getState().replaceClips(
              storeApi.getState().clips.map((c) => (c.id === clip.id ? { ...c, text: e.target.value } : c))
            )
          }
          className="min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    );
  }

  return null;
};

export default Inspector;
