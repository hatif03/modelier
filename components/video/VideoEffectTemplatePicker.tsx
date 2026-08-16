"use client";

import { useEffect, useState } from "react";

type Template = { id: string; label?: string; thumbnailUrl?: string };

type Props = {
  feature: string;
  value: string | null;
  onSelect: (id: string) => void;
};

// A small template-swatch picker for Video Studio's AI effects — same
// fetch-from-/api/effect-templates pattern duplicated a couple of times
// already across AI Model Studio's own panels (EffectParamsForm.tsx,
// GenerativePortraitOptions.tsx); kept local to components/video rather than
// imported from there since that module is AI Model Studio-specific.
const VideoEffectTemplatePicker = ({ feature, value, onSelect }: Props) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
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

  if (error) return <p className="text-xs text-destructive">Couldn&apos;t load style options.</p>;
  if (templates.length === 0) return <p className="text-xs text-muted-foreground">Loading options…</p>;

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          onClick={() => onSelect(t.id)}
          className={`hover-lift relative aspect-square overflow-hidden rounded-md border-2 bg-muted ${
            value === t.id ? "border-primary" : "border-transparent"
          }`}
        >
          {t.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.thumbnailUrl} alt={t.label ?? t.id} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center px-1 text-center text-[9px] text-muted-foreground">
              {t.label ?? t.id}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default VideoEffectTemplatePicker;
