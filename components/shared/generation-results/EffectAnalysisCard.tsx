"use client";

import { GenerationVariantView } from "@/lib/ai-model-studio/types";

type Props = {
  variant: GenerationVariantView;
};

const humanize = (key: string) => key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

const isHexColor = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

// Data-output effects (skin analysis, face analyzer, skin tone analysis,
// Fitzpatrick skin type) return scores/metrics, not a rendered image — this
// renders whatever shape came back rather than assuming one fixed schema,
// since each of those four effects returns a different result shape.
const EffectAnalysisCard = ({ variant }: Props) => {
  if (variant.status === "processing") {
    return (
      <div className="flex aspect-[3/4] animate-pulse flex-col items-center justify-center rounded-sm border border-border bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
        Analyzing…
      </div>
    );
  }

  if (variant.status === "error") {
    return (
      <div className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-sm border border-l-2 border-destructive/40 border-l-destructive bg-destructive/5 p-2 text-center text-[11px] text-destructive">
        {variant.errorMessage ?? "Analysis failed."}
      </div>
    );
  }

  const result = variant.analysisResult ?? {};
  const output = Array.isArray((result as any).output) ? ((result as any).output as Array<{ type: string; ui_score: number }>) : null;
  const colors = (result as any).color && typeof (result as any).color === "object" ? ((result as any).color as Record<string, unknown>) : null;
  const flatEntries = !output && !colors ? Object.entries(result).filter(([, v]) => typeof v === "string" || typeof v === "number") : [];

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{variant.referenceModelLabel}</p>

      {output && (
        <div className="flex flex-col gap-2">
          {output.map((item) => (
            <div key={item.type} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="capitalize text-foreground">{humanize(item.type)}</span>
                <span className="tabular-nums text-muted-foreground">{Math.round(item.ui_score)}</span>
              </div>
              <div className="h-1 rounded-full bg-muted">
                <div className="h-1 rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, item.ui_score))}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {colors && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(colors)
            .filter(([, v]) => isHexColor(v))
            .map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-[11px]">
                <span className="h-3.5 w-3.5 rounded-full border border-border" style={{ backgroundColor: value as string }} />
                <span className="capitalize text-muted-foreground">{humanize(key)}</span>
              </div>
            ))}
        </div>
      )}

      {flatEntries.length > 0 && (
        <div className="flex flex-col gap-1">
          {flatEntries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-[11px]">
              <span className="capitalize text-muted-foreground">{humanize(key)}</span>
              <span className="text-foreground">{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {!output && !colors && flatEntries.length === 0 && <p className="text-[11px] text-muted-foreground">No details returned.</p>}
    </div>
  );
};

export default EffectAnalysisCard;
