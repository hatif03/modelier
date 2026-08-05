"use client";

import Image from "next/image";

import { GenerationVariantView } from "@/lib/ai-model-studio/types";
import { Button } from "@/components/ui/button";

type Props = {
  variant: GenerationVariantView;
  onAddToCanvas: (url: string) => void;
  onDropIntoPlaceholder?: (url: string) => void;
};

const VariantCard = ({ variant, onAddToCanvas, onDropIntoPlaceholder }: Props) => {
  if (variant.status === "processing") {
    return (
      <div className="flex aspect-[3/4] animate-pulse flex-col items-center justify-center rounded-sm border border-border bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground">
        Generating…
      </div>
    );
  }

  if (variant.status === "error") {
    return (
      <div className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-sm border border-l-2 border-destructive/40 border-l-destructive bg-destructive/5 p-2 text-center text-[11px] text-destructive">
        {variant.errorMessage ?? "Generation failed."}
      </div>
    );
  }

  return (
    <div className={`flex flex-col overflow-hidden rounded-sm border ${variant.isBestMatch ? "border-accent" : "border-border"}`}>
      <div className={`relative w-full bg-muted/30 ${variant.isVideo ? "aspect-video" : "aspect-[3/4]"}`}>
        {variant.resultImageUrl && variant.isVideo ? (
          <video src={variant.resultImageUrl} controls loop className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          variant.resultImageUrl && (
            <Image
              src={variant.resultImageUrl}
              alt={variant.referenceModelLabel}
              fill
              unoptimized
              className="object-cover"
            />
          )
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{variant.referenceModelLabel}</p>
        {variant.colorHarmonyNote && (
          <p className="font-serif text-xs italic text-foreground">{variant.colorHarmonyNote}</p>
        )}
        {variant.isVideo ? (
          <a
            href={variant.resultImageUrl}
            download
            className="rounded-sm border border-border bg-background px-2 py-1.5 text-center text-[11px] hover:border-accent hover:text-accent"
          >
            Download clip
          </a>
        ) : (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-border bg-background text-[11px] hover:border-accent hover:bg-background hover:text-accent"
              onClick={() => variant.resultImageUrl && onAddToCanvas(variant.resultImageUrl)}
            >
              Add to canvas
            </Button>
            {onDropIntoPlaceholder && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-border bg-background text-[11px] hover:border-accent hover:bg-background hover:text-accent"
                onClick={() => variant.resultImageUrl && onDropIntoPlaceholder(variant.resultImageUrl)}
              >
                Drop in
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VariantCard;
