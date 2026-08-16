"use client";

import { useEffect, useState } from "react";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  EffectDefinition,
  EffectTemplateControl,
  EffectSliderControl,
  EffectSelectControl,
  EffectTextControl,
} from "@/lib/ai-model-studio/effects";

type Props = {
  effect: EffectDefinition;
  values: Record<string, number | string>;
  onChange: (key: string, value: number | string) => void;
};

type Template = { id: string; label?: string; thumbnailUrl?: string };

// A template control's options aren't known statically (they're a live
// PerfectCorp swatch pack) — fetched once per control here rather than
// threaded down as a prop, since only this form cares about the raw list.
const TemplateSwatchPicker = ({
  control,
  value,
  onSelect,
}: {
  control: EffectTemplateControl;
  value: string | number | undefined;
  onSelect: (id: string) => void;
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/effect-templates?feature=${encodeURIComponent(control.feature)}`)
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
  }, [control.feature]);

  if (error) return <p className="text-xs text-destructive">Couldn&apos;t load {control.label.toLowerCase()} options.</p>;
  if (templates.length === 0) return <p className="text-xs text-muted-foreground">Loading options…</p>;

  return (
    <div className="grid grid-cols-3 gap-2">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          title={template.label}
          onClick={() => onSelect(template.id)}
          className={`hover-lift relative aspect-square overflow-hidden rounded-md border-2 bg-muted ${
            value === template.id ? "border-primary" : "border-transparent"
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
  );
};

// Renders one form from an effect's `controls` config instead of a bespoke
// component per effect — parameter forms collapsed into one, driven entirely
// by data. Template swatches are required, so they render up-front; slider/
// select fine-tuning defaults to a closed "Advanced" section so a
// non-technical user can hit Generate with the effect's own natural-looking
// defaults untouched.
const EffectParamsForm = ({ effect, values, onChange }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (effect.kind === "data") {
    return (
      <div className="px-5 py-3 text-xs text-muted-foreground">
        This runs an analysis and returns a report, not an edited photo.
      </div>
    );
  }

  const templateControls = effect.controls.filter((c): c is EffectTemplateControl => c.type === "template");
  const textControls = effect.controls.filter((c): c is EffectTextControl => c.type === "text");
  const tunableControls = effect.controls.filter(
    (c): c is EffectSliderControl | EffectSelectControl => c.type !== "template" && c.type !== "text"
  );

  if (effect.controls.length === 0) {
    return <div className="px-5 py-3 text-xs text-muted-foreground">No adjustments needed — just upload a photo and generate.</div>;
  }

  return (
    <div className="flex flex-col border-b border-border">
      {templateControls.map((control) => (
        <div key={control.key} className="flex flex-col gap-2 px-5 py-3">
          <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">{control.label}</h4>
          <TemplateSwatchPicker control={control} value={values[control.key]} onSelect={(id) => onChange(control.key, id)} />
        </div>
      ))}

      {textControls.map((control) => (
        <div key={control.key} className="flex flex-col gap-2 px-5 py-3">
          <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {control.label}
            {control.required ? " *" : " (optional)"}
          </h4>
          <Input
            value={String(values[control.key] ?? "")}
            placeholder={control.placeholder}
            onChange={(e) => onChange(control.key, e.target.value)}
          />
        </div>
      ))}

      {tunableControls.length === 0 ? null : (
        <>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center justify-between px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <span>{showAdvanced ? "Hide adjustments" : "Natural preset applied — adjust manually"}</span>
            <span>{showAdvanced ? "−" : "+"}</span>
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-4 px-5 pb-4">
              {tunableControls.map((control) => {
                if (control.type === "select") {
                  return (
                    <div key={control.key} className="flex flex-col gap-2">
                      <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">{control.label}</h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        {control.options.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(control.key, option.value)}
                            className={`rounded-sm border px-2 py-1.5 text-[11px] ${
                              String(values[control.key] ?? control.default) === option.value
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                const value = Number(values[control.key] ?? control.default);
                return (
                  <div key={control.key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">{control.label}</h4>
                      <Label className="text-xs text-foreground">{value}</Label>
                    </div>
                    <Slider
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      value={[value]}
                      onValueChange={([next]) => onChange(control.key, next)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EffectParamsForm;
