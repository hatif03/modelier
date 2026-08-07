"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { FORMATS } from "@/lib/formats";
import CustomSizeDialog from "./CustomSizeDialog";

type Props = {
  query: string;
  customSizeOpen: boolean;
  onCustomSizeOpenChange: (open: boolean) => void;
};

const QuickCreateTiles = ({ query, customSizeOpen, onCustomSizeOpenChange }: Props) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const visibleFormats = FORMATS.filter((f) => f.label.toLowerCase().includes(query.toLowerCase()));
  const showCustom = "custom size".includes(query.toLowerCase()) || query === "";

  const createProject = async (body: Record<string, unknown>) => {
    setIsCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setIsCreating(false);
    if (res.ok) router.push(`/design/${json.project.id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Create a design</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {visibleFormats.map((format) => {
          const Icon = format.icon;
          return (
            <button
              key={format.id}
              disabled={isCreating}
              onClick={() => createProject({ format: format.id })}
              className="hover-lift flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center hover:border-accent/60 disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-foreground">{format.label}</span>
              <span className="text-[10px] text-muted-foreground">{format.aspectLabel}</span>
            </button>
          );
        })}

        {showCustom && (
          <button
            onClick={() => onCustomSizeOpenChange(true)}
            className="hover-lift flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card p-4 text-center hover:border-accent/60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-accent">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs text-foreground">Custom size</span>
          </button>
        )}
      </div>

      <CustomSizeDialog
        open={customSizeOpen}
        onOpenChange={onCustomSizeOpenChange}
        isCreating={isCreating}
        onCreate={(width, height) => createProject({ format: "custom", width, height })}
      />
    </div>
  );
};

export default QuickCreateTiles;
