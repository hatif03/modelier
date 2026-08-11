import { GenerationVariantView } from "@/lib/ai-model-studio/types";
import VariantCard from "./VariantCard";
import EffectAnalysisCard from "./EffectAnalysisCard";
import MagicPaletteBar from "./MagicPaletteBar";

type Props = {
  variants: GenerationVariantView[];
  onAddToCanvas?: (url: string) => void;
  onDropIntoPlaceholder?: (url: string) => void;
  /** Only relevant for isVideo variants — this canvas has no timeline to drop a clip onto. */
  onSendToVideoStudio?: (url: string) => void;
  className?: string;
  /** The apparel/jewelry source photo's extracted dominant color, if any — renders a Magic Palette bar above the grid. */
  garmentColorHex?: string;
};

// Shared by the main editor's AI Model Studio panel and Jewelry Studio's
// "Preview on a model" modal — previously each had its own separate
// reimplementation of this same grid.
const GenerationResultsGrid = ({
  variants,
  onAddToCanvas,
  onDropIntoPlaceholder,
  onSendToVideoStudio,
  className,
  garmentColorHex,
}: Props) => (
  <>
    {garmentColorHex && (
      <div className="px-5 pt-3">
        <MagicPaletteBar hex={garmentColorHex} />
      </div>
    )}
    <div className={className ?? "grid grid-cols-2 gap-3 px-5 py-3"}>
      {variants.map((variant) => (
        <div key={variant.id} className={variant.isVideo ? "col-span-2" : undefined}>
          {variant.isAnalysis ? (
            <EffectAnalysisCard variant={variant} />
          ) : (
            <VariantCard
              variant={variant}
              onAddToCanvas={onAddToCanvas}
              onDropIntoPlaceholder={onDropIntoPlaceholder}
              onSendToVideoStudio={onSendToVideoStudio}
            />
          )}
        </div>
      ))}
    </div>
  </>
);

export default GenerationResultsGrid;
