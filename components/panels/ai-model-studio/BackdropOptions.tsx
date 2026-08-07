"use client";

import { PillGroup } from "@/components/ui/pill-button";
import { BACKDROP_PRESETS } from "@/lib/ai-model-studio/backdrops";

type Props = {
  preset: string | null;
  onPresetChange: (id: string) => void;
  extra: string;
  onExtraChange: (value: string) => void;
};

const BackdropOptions = ({ preset, onPresetChange, extra, onExtraChange }: Props) => (
  <div className="flex flex-col gap-4 px-5 py-3">
    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Scene</h3>
      <PillGroup options={BACKDROP_PRESETS} value={preset} onChange={onPresetChange} />
    </div>

    <div className="flex flex-col gap-2">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Extra detail (optional)</h3>
      <textarea
        value={extra}
        onChange={(e) => onExtraChange(e.target.value)}
        placeholder="e.g. pastel pink tones, marble floor, palm leaves"
        rows={3}
        className="rounded-sm border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground"
      />
    </div>
  </div>
);

export default BackdropOptions;
