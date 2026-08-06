"use client";

import { cn } from "@/lib/utils";
import { PillGroup } from "@/components/ui/pill-button";

type CategorySelectorProps<T extends string> = {
  label?: string;
  categories: { id: T; label: string }[];
  value: T | null;
  onChange: (category: T) => void;
  className?: string;
};

// Generic category-chip picker — replaces what used to be two near-identical
// components (ApparelCategorySelector, JewelryCategorySelector) that only
// differed in their options array, and is reused a third time by Jewelry
// Studio's own "new design" category chips (see components/jewelry/NewDesignTiles.tsx).
// className overrides the wrapper's padding — the 320px editor panel and the
// full-width dashboard page need different spacing around the same chips.
function CategorySelector<T extends string>({
  label = "Category",
  categories,
  value,
  onChange,
  className,
}: CategorySelectorProps<T>) {
  return (
    <div className={cn("flex flex-col gap-2 px-5 py-3", className)}>
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</h3>
      <PillGroup options={categories} value={value} onChange={onChange} />
    </div>
  );
}

export default CategorySelector;
