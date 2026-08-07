"use client";

import { cn } from "@/lib/utils";

export type CastingModel = { id: string; label: string; bodyType: string; undertone: string };

type Props = {
  models: CastingModel[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxSelectable: number;
};

// The full-cast diversity batch used to be all-or-nothing — every active
// ReferenceModel, every time. This turns it into an actual casting call: pick
// which of the (small, curated) cast is in this particular shoot before
// generating, rather than always rendering the whole roster.
const CastingCallPicker = ({ models, selectedIds, onToggle, maxSelectable }: Props) => {
  if (models.length === 0) return null;

  const atLimit = selectedIds.length >= maxSelectable;

  return (
    <div className="flex flex-col gap-2 px-5 py-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Casting call</h3>
        <span className="text-[10px] text-muted-foreground">
          {selectedIds.length}/{maxSelectable} selected
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {models.map((model) => {
          const selected = selectedIds.includes(model.id);
          const disabled = !selected && atLimit;
          return (
            <button
              key={model.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onToggle(model.id)}
              className={cn(
                "flex items-center justify-between rounded-sm border px-2.5 py-1.5 text-left text-xs transition-colors",
                selected
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40"
              )}
            >
              <span>{model.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{model.bodyType}</span>
            </button>
          );
        })}
      </div>
      {atLimit && (
        <p className="text-[10px] text-muted-foreground">A single casting call renders at most {maxSelectable} looks.</p>
      )}
    </div>
  );
};

export default CastingCallPicker;
