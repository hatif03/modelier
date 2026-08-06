import { GenerationVariantView } from "@/lib/ai-model-studio/types";
import VariantCard from "./VariantCard";

type Props = {
  variants: GenerationVariantView[];
  onAddToCanvas?: (url: string) => void;
  onDropIntoPlaceholder?: (url: string) => void;
  className?: string;
};

// Shared by the main editor's AI Model Studio panel and Jewelry Studio's
// "Preview on a model" modal — previously each had its own separate
// reimplementation of this same grid.
const GenerationResultsGrid = ({ variants, onAddToCanvas, onDropIntoPlaceholder, className }: Props) => (
  <div className={className ?? "grid grid-cols-2 gap-3 px-5 py-3"}>
    {variants.map((variant) => (
      <div key={variant.id} className={variant.isVideo ? "col-span-2" : undefined}>
        <VariantCard variant={variant} onAddToCanvas={onAddToCanvas} onDropIntoPlaceholder={onDropIntoPlaceholder} />
      </div>
    ))}
  </div>
);

export default GenerationResultsGrid;
