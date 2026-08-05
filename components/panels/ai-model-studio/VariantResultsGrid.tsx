import { GenerationVariantView } from "@/lib/ai-model-studio/types";
import VariantCard from "./VariantCard";

type Props = {
  variants: GenerationVariantView[];
  onAddToCanvas: (url: string) => void;
  onDropIntoPlaceholder?: (url: string) => void;
};

const VariantResultsGrid = ({ variants, onAddToCanvas, onDropIntoPlaceholder }: Props) => (
  <div className="grid grid-cols-2 gap-3 px-5 py-3">
    {variants.map((variant) => (
      <div key={variant.id} className={variant.isVideo ? "col-span-2" : undefined}>
        <VariantCard variant={variant} onAddToCanvas={onAddToCanvas} onDropIntoPlaceholder={onDropIntoPlaceholder} />
      </div>
    ))}
  </div>
);

export default VariantResultsGrid;
