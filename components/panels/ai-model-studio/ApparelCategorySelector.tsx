"use client";

import { ApparelCategory } from "@/lib/ai-model-studio/types";

const CATEGORIES: { id: ApparelCategory; label: string }[] = [
  { id: "upper_body", label: "Top" },
  { id: "lower_body", label: "Bottom" },
  { id: "full_body", label: "Dress / Outfit" },
  { id: "auto", label: "Auto-detect" },
];

type Props = {
  value: ApparelCategory | null;
  onChange: (category: ApparelCategory) => void;
};

const ApparelCategorySelector = ({ value, onChange }: Props) => (
  <div className="flex flex-col gap-2 px-5 py-3">
    <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">Category</h3>
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`rounded-sm border px-3 py-1.5 text-xs ${
            value === c.id
              ? "border-accent bg-accent/10 font-semibold text-foreground"
              : "border-border text-muted-foreground hover:border-accent/60"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  </div>
);

export default ApparelCategorySelector;
