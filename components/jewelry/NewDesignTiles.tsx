"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import { JEWELRY_CATEGORIES } from "@/lib/ai-model-studio/types";
import CategorySelector from "@/components/shared/CategorySelector";

// earring/bracelet need a sub-style at creation time — stud/hoop/dangle and
// chain/bangle/cuff are structurally different feature trees, not parameter
// variations of one shape (see lib/jewelry/cad/schema/{earring,bracelet}.ts).
const CAD_STYLES: Partial<Record<JewelryCategory, { id: string; label: string }[]>> = {
  earring: [
    { id: "stud", label: "Stud" },
    { id: "hoop", label: "Hoop" },
    { id: "dangle", label: "Dangle" },
  ],
  bracelet: [
    { id: "chain", label: "Chain" },
    { id: "bangle", label: "Bangle" },
    { id: "cuff", label: "Cuff" },
  ],
};

const NewDesignTiles = () => {
  const router = useRouter();
  const [category, setCategory] = useState<JewelryCategory>("ring");
  const [isCreating, setIsCreating] = useState(false);

  const startDesign = async (method: "configurator" | "sketch" | "cad", cadStyle?: string) => {
    setIsCreating(true);
    const res = await fetch("/api/jewelry-designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, method, cadStyle }),
    });
    const json = await res.json();
    setIsCreating(false);
    if (res.ok) router.push(`/jewelry/${json.jewelryDesign.id}`);
  };

  const cadStyles = CAD_STYLES[category];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Design a new piece</h2>

      <CategorySelector categories={JEWELRY_CATEGORIES} value={category} onChange={setCategory} className="px-0 py-0" />

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <button
          disabled={isCreating}
          onClick={() => startDesign("sketch")}
          className="flex flex-col items-center gap-2 rounded-sm border border-border bg-card p-4 text-center hover:border-accent/60 disabled:opacity-50"
        >
          <span className="text-xs text-foreground">Sketch</span>
          <span className="text-[10px] text-muted-foreground">Draw it freehand</span>
        </button>
        <button
          disabled={isCreating}
          onClick={() => startDesign("configurator")}
          className="flex flex-col items-center gap-2 rounded-sm border border-border bg-card p-4 text-center hover:border-accent/60 disabled:opacity-50"
        >
          <span className="text-xs text-foreground">Configurator</span>
          <span className="text-[10px] text-muted-foreground">Pick from preset parts (needs setup)</span>
        </button>
        {!cadStyles && (
          <button
            disabled={isCreating}
            onClick={() => startDesign("cad")}
            className="flex flex-col items-center gap-2 rounded-sm border border-border bg-card p-4 text-center hover:border-accent/60 disabled:opacity-50"
          >
            <span className="text-xs text-foreground">3D Studio</span>
            <span className="text-[10px] text-muted-foreground">Real parametric 3D + STL/STEP export</span>
          </button>
        )}
      </div>

      {cadStyles && (
        <div className="flex flex-col gap-2 sm:max-w-lg">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">3D Studio — pick a style</h3>
          <div className="grid grid-cols-3 gap-3">
            {cadStyles.map((style) => (
              <button
                key={style.id}
                disabled={isCreating}
                onClick={() => startDesign("cad", style.id)}
                className="flex flex-col items-center gap-2 rounded-sm border border-border bg-card p-4 text-center hover:border-accent/60 disabled:opacity-50"
              >
                <span className="text-xs text-foreground">{style.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewDesignTiles;
