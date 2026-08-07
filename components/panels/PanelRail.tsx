"use client";

import { Sparkles, LayoutTemplate, Palette, Upload, Layers as LayersIcon, MessageCircle, type LucideIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type PanelTabId = "ai-studio" | "assistant" | "templates" | "brand-kit" | "uploads" | "layers";

const RAIL_ITEMS: { id: PanelTabId; label: string; icon: LucideIcon }[] = [
  { id: "ai-studio", label: "AI Model", icon: Sparkles },
  { id: "assistant", label: "Style Assistant", icon: MessageCircle },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "brand-kit", label: "Brand Kit", icon: Palette },
  { id: "uploads", label: "Uploads", icon: Upload },
  { id: "layers", label: "Layers", icon: LayersIcon },
];

type Props = {
  active: PanelTabId | null;
  onChange: (tab: PanelTabId) => void;
};

const PanelRail = ({ active, onChange }: Props) => (
  <nav className="sticky left-0 flex h-full w-14 shrink-0 flex-col items-center gap-1 border-t border-border bg-card py-3 max-sm:hidden">
    {RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
      <Tooltip key={id} delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            aria-pressed={active === id}
            onClick={() => onChange(id)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active === id && "bg-accent/10 text-accent"
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    ))}
  </nav>
);

export default PanelRail;
