"use client";

import { useEffect, useState } from "react";

import Dropzone from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";
import { PillGroup } from "@/components/ui/pill-button";

type Resolution = "480" | "720" | "1080";
type VideoGenMode = "prompt" | "template";
type Template = { id: string; label?: string; thumbnailUrl?: string };

type Props = {
  file: File | null;
  onFileSelected: (file: File) => void;
  hasCanvasSelection: boolean;
  useCanvasSelection: boolean;
  onUseCanvasSelection: () => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  resolution: Resolution;
  onResolutionChange: (value: Resolution) => void;
  durationSeconds: 5 | 10;
  onDurationChange: (value: 5 | 10) => void;
  // AI Video Generator (v1, template-based) — a second input style on the
  // same flow as the prompt-based v2 generator above, rather than a wholly
  // separate flow (see generativePortraits.ts's header note on scope).
  mode: VideoGenMode;
  onModeChange: (mode: VideoGenMode) => void;
  templateId: string | null;
  onTemplateChange: (id: string) => void;
};

const MODE_OPTIONS: { id: VideoGenMode; label: string }[] = [
  { id: "prompt", label: "Describe it" },
  { id: "template", label: "Pick a template" },
];

const RESOLUTION_OPTIONS: { id: Resolution; label: string }[] = [
  { id: "480", label: "480p" },
  { id: "720", label: "720p" },
  { id: "1080", label: "1080p" },
];

const DURATION_OPTIONS: { id: "5" | "10"; label: string }[] = [
  { id: "5", label: "5s" },
  { id: "10", label: "10s" },
];

const VideoOptions = ({
  file,
  onFileSelected,
  hasCanvasSelection,
  useCanvasSelection,
  onUseCanvasSelection,
  prompt,
  onPromptChange,
  resolution,
  onResolutionChange,
  durationSeconds,
  onDurationChange,
  mode,
  onModeChange,
  templateId,
  onTemplateChange,
}: Props) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesError, setTemplatesError] = useState(false);

  useEffect(() => {
    if (mode !== "template") return;
    let cancelled = false;
    fetch("/api/effect-templates?feature=image-to-video")
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setTemplates(json.templates ?? []);
      })
      .catch(() => {
        if (!cancelled) setTemplatesError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
  <div className="flex flex-col gap-4 px-5 py-3">
    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Source image</h3>
      {hasCanvasSelection && (
        <Button
          size="sm"
          variant={useCanvasSelection ? "default" : "outline"}
          onClick={onUseCanvasSelection}
          className={useCanvasSelection ? "w-full" : "w-full border-border bg-background hover:border-accent hover:bg-background hover:text-accent"}
        >
          Use selected image on canvas
        </Button>
      )}
      <Dropzone file={file} onFileSelected={onFileSelected} label="Upload a photo to animate" />
    </div>

    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Motion</h3>
      <PillGroup options={MODE_OPTIONS} value={mode} onChange={onModeChange} pillClassName="flex-1 text-center" />
    </div>

    {mode === "prompt" ? (
      <div className="flex flex-col gap-2">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g. slow zoom in, fabric gently moving in the wind"
          rows={3}
          className="rounded-sm border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        {templatesError ? (
          <p className="text-xs text-destructive">Couldn&apos;t load motion templates.</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading options…</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.label}
                onClick={() => onTemplateChange(t.id)}
                className={`hover-lift relative aspect-square overflow-hidden rounded-md border-2 bg-muted ${
                  templateId === t.id ? "border-primary" : "border-transparent"
                }`}
              >
                {t.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.thumbnailUrl} alt={t.label ?? t.id} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground">
                    {t.label ?? t.id}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )}

    <div className="flex gap-3">
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Resolution</h3>
        <PillGroup
          options={RESOLUTION_OPTIONS}
          value={resolution}
          onChange={onResolutionChange}
          pillClassName="flex-1 text-center"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Duration</h3>
        <PillGroup
          options={DURATION_OPTIONS}
          value={String(durationSeconds) as "5" | "10"}
          onChange={(v) => onDurationChange(Number(v) as 5 | 10)}
          pillClassName="flex-1 text-center"
        />
      </div>
    </div>
  </div>
  );
};

export default VideoOptions;
