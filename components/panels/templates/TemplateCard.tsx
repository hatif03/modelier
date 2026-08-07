import Image from "next/image";

import { Button } from "@/components/ui/button";

export type Template = {
  id: string;
  name: string;
  format: string;
  thumbnailUrl: string;
  canvasJson: Record<string, unknown>[];
};

type Props = {
  template: Template;
  onUse: (template: Template) => void;
};

const TemplateCard = ({ template, onUse }: Props) => {
  const isSwatchColor = template.thumbnailUrl.startsWith("#");

  return (
    <div className="hover-lift flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div
        className="relative flex aspect-square w-full items-center justify-center"
        style={isSwatchColor ? { backgroundColor: template.thumbnailUrl } : undefined}
      >
        {!isSwatchColor && (
          <Image src={template.thumbnailUrl} alt={template.name} fill unoptimized className="object-cover" />
        )}
        <div className="h-2/3 w-2/3 rounded-md border border-dashed border-accent" />
      </div>
      <div className="flex flex-col gap-2 p-2">
        <p className="font-serif text-sm text-foreground">{template.name}</p>
        <Button
          size="sm"
          variant="outline"
          className="w-full border-border bg-background text-[11px] hover:border-accent hover:bg-background hover:text-accent"
          onClick={() => onUse(template)}
        >
          Use template
        </Button>
      </div>
    </div>
  );
};

export default TemplateCard;
