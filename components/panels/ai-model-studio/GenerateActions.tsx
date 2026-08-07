import { Button } from "@/components/ui/button";

type Props = {
  onGenerate: () => void;
  onGenerateBatch?: () => void;
  disabled: boolean;
  isGenerating: boolean;
  batchLabel?: string;
};

const GenerateActions = ({ onGenerate, onGenerateBatch, disabled, isGenerating, batchLabel = "Generate diverse batch" }: Props) => (
  <div className="flex flex-col gap-2 px-5 py-3">
    <Button disabled={disabled || isGenerating} onClick={onGenerate} className="w-full">
      {isGenerating ? "Generating…" : "Generate"}
    </Button>
    {onGenerateBatch && (
      <Button
        disabled={disabled || isGenerating}
        onClick={onGenerateBatch}
        variant="outline"
        className="w-full border-border bg-background hover:border-accent hover:bg-background hover:text-accent"
      >
        {batchLabel}
      </Button>
    )}
  </div>
);

export default GenerateActions;
