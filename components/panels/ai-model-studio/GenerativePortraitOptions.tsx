"use client";

import { useEffect, useState } from "react";

import Dropzone from "@/components/ui/dropzone";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

type Template = { id: string; label?: string; thumbnailUrl?: string };

type Props = {
  feature: string;
  file: File | null;
  onFileSelected: (file: File | null) => void;
  templateId: string | null;
  onTemplateChange: (id: string) => void;
  outputCount: number;
  onOutputCountChange: (count: number) => void;
};

// Shared UI for AI Avatar Generator / AI Headshot Generator / AI Studio
// Generator — all three are the same shape (a selfie in, a curated
// template applied, N stylized portraits out), so one component covers all
// three flows rather than duplicating a near-identical form three times.
const GenerativePortraitOptions = ({
  feature,
  file,
  onFileSelected,
  templateId,
  onTemplateChange,
  outputCount,
  onOutputCountChange,
}: Props) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTemplates([]);
    fetch(`/api/effect-templates?feature=${encodeURIComponent(feature)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setTemplates(json.templates ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [feature]);

  return (
    <div className="flex flex-col gap-4 px-5 py-3">
      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Selfie</h3>
        <Dropzone file={file} onFileSelected={onFileSelected} label="Upload a clear, front-facing selfie" />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Style</h3>
        {error ? (
          <p className="text-xs text-destructive">Couldn&apos;t load style options.</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-muted-foreground">Loading options…</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                title={template.label}
                onClick={() => onTemplateChange(template.id)}
                className={`hover-lift relative aspect-square overflow-hidden rounded-md border-2 bg-muted ${
                  templateId === template.id ? "border-primary" : "border-transparent"
                }`}
              >
                {template.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.thumbnailUrl} alt={template.label ?? template.id} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground">
                    {template.label ?? template.id}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Variations</h3>
          <Label className="text-xs text-foreground">{outputCount}</Label>
        </div>
        <Slider min={1} max={8} step={1} value={[outputCount]} onValueChange={([v]) => onOutputCountChange(v)} />
      </div>
    </div>
  );
};

export default GenerativePortraitOptions;
