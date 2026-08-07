"use client";

import { AIStudioFlow } from "@/lib/ai-model-studio/types";
import { EFFECTS, EFFECT_CATEGORIES, getEffect, type EffectCategory } from "@/lib/ai-model-studio/effects";
import { UPCOMING_EFFECTS } from "@/lib/ai-model-studio/upcomingEffects";
import { PillButton } from "@/components/ui/pill-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  flow: AIStudioFlow;
  effectId: string | null;
  onChangeFlow: (flow: AIStudioFlow) => void;
  onChangeEffect: (effectId: string) => void;
};

const FLOWS: { id: AIStudioFlow; label: string }[] = [
  { id: "apparel_vto", label: "Apparel" },
  { id: "makeup_vto", label: "Beauty" },
  { id: "jewelry_vto", label: "Jewelry" },
  { id: "image_to_video", label: "Video" },
  { id: "backdrop", label: "Backdrop" },
];

// Two-level picker: the top row is flow/category-first (four existing
// try-on flows, plus three effect categories); picking an effect category
// opens a second row of the specific effects within it. Category-first
// matches how many effects there are (14) to fit — a flat list that long
// wouldn't scan as a single row of pills.
const FlowSelector = ({ flow, effectId, onChangeFlow, onChangeEffect }: Props) => {
  const activeCategory: EffectCategory | null = flow === "effect" ? getEffect(effectId ?? "")?.category ?? null : null;

  return (
    <div className="flex flex-col gap-2 px-5 pt-4">
      <div className="grid grid-cols-3 gap-2">
        {FLOWS.map((f) => (
          <PillButton key={f.id} active={flow === f.id} onClick={() => onChangeFlow(f.id)} className="py-2 text-center uppercase tracking-wide">
            {f.label}
          </PillButton>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {EFFECT_CATEGORIES.map((c) => (
          <PillButton
            key={c.id}
            active={activeCategory === c.id}
            onClick={() => {
              const firstEffect = EFFECTS.find((e) => e.category === c.id);
              if (firstEffect) onChangeEffect(firstEffect.id);
              onChangeFlow("effect");
            }}
            className="py-2 text-center text-[11px] uppercase tracking-wide"
          >
            {c.label}
          </PillButton>
        ))}
      </div>

      {activeCategory && (
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
          {EFFECTS.filter((e) => e.category === activeCategory).map((e) => (
            <PillButton
              key={e.id}
              active={effectId === e.id}
              onClick={() => onChangeEffect(e.id)}
              className={cn("px-2 py-1 text-[11px]", effectId === e.id ? "text-accent" : undefined)}
            >
              {e.label}
            </PillButton>
          ))}
          {UPCOMING_EFFECTS.filter((e) => e.category === activeCategory).map((e) => (
            <button
              key={e.id}
              type="button"
              disabled
              title={e.description}
              className="flex cursor-not-allowed items-center gap-1.5 rounded-sm border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground/60"
            >
              {e.label}
              <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
                Soon
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowSelector;
