"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { JewelryCategory } from "@/lib/ai-model-studio/types";
import { JEWELRY_CATEGORIES } from "@/lib/ai-model-studio/types";
import CategorySelector from "@/components/shared/CategorySelector";

const NewDesignTiles = () => {
  const router = useRouter();
  const [category, setCategory] = useState<JewelryCategory>("ring");
  const [isCreating, setIsCreating] = useState(false);

  const startDesign = async (method: "configurator" | "sketch") => {
    setIsCreating(true);
    const res = await fetch("/api/jewelry-designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, method }),
    });
    const json = await res.json();
    setIsCreating(false);
    if (res.ok) router.push(`/jewelry/${json.jewelryDesign.id}`);
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[10px] uppercase tracking-widest text-muted-foreground">Design a new piece</h2>

      <CategorySelector categories={JEWELRY_CATEGORIES} value={category} onChange={setCategory} className="px-0 py-0" />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
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
      </div>
    </div>
  );
};

export default NewDesignTiles;
