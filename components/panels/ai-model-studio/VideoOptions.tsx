"use client";

import Dropzone from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";

type Resolution = "480" | "720" | "1080";

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
};

const RESOLUTIONS: Resolution[] = ["480", "720", "1080"];

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
}: Props) => (
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
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="e.g. slow zoom in, fabric gently moving in the wind"
        rows={3}
        className="rounded-sm border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground"
      />
    </div>

    <div className="flex gap-3">
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Resolution</h3>
        <div className="flex gap-1.5">
          {RESOLUTIONS.map((r) => (
            <button
              key={r}
              onClick={() => onResolutionChange(r)}
              className={`flex-1 rounded-sm border px-2 py-1.5 text-xs ${
                resolution === r
                  ? "border-accent bg-accent/10 font-semibold text-foreground"
                  : "border-border text-muted-foreground hover:border-accent/60"
              }`}
            >
              {r}p
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Duration</h3>
        <div className="flex gap-1.5">
          {[5, 10].map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d as 5 | 10)}
              className={`flex-1 rounded-sm border px-2 py-1.5 text-xs ${
                durationSeconds === d
                  ? "border-accent bg-accent/10 font-semibold text-foreground"
                  : "border-border text-muted-foreground hover:border-accent/60"
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default VideoOptions;
