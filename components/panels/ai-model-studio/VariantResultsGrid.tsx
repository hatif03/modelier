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
      <VariantCard
        key={variant.id}
        variant={variant}
        onAddToCanvas={onAddToCanvas}
        onDropIntoPlaceholder={onDropIntoPlaceholder}
      />
    ))}
  </div>
);

export default VariantResultsGrid;
